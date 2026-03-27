import { getIronSession } from "iron-session";

const fallbackSecret = "replace_this_with_a_32_character_secret";

const sessionPassword = process.env.SESSION_SECRET || fallbackSecret;

if (sessionPassword.length < 32) {
  throw new Error("SESSION_SECRET must be at least 32 characters long");
}

export const sessionOptions = {
  password: sessionPassword,
  cookieName: "installment_manager_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

export async function getSession(req, res) {
  return getIronSession(req, res, sessionOptions);
}

export async function requireApiAuth(req, res) {
  const session = await getSession(req, res);

  if (!session.user?.isLoggedIn) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }

  return session;
}

export function withApiAuth(handler) {
  return async function authWrappedHandler(req, res) {
    const session = await requireApiAuth(req, res);
    if (!session) {
      return;
    }

    return handler(req, res, session);
  };
}

export function withPageAuth(handler) {
  return async function pageAuthWrapper(context) {
    const session = await getSession(context.req, context.res);

    if (!session.user?.isLoggedIn) {
      return {
        redirect: {
          destination: "/login",
          permanent: false,
        },
      };
    }

    const result = handler ? await handler(context, session) : { props: {} };

    if (result?.redirect || result?.notFound) {
      return result;
    }

    return {
      ...result,
      props: {
        ...(result.props || {}),
        sessionUser: session.user,
      },
    };
  };
}

export async function redirectIfAuthenticated(context) {
  const session = await getSession(context.req, context.res);

  if (session.user?.isLoggedIn) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return { props: {} };
}
