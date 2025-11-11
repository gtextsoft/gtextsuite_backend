import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";

/**
 * Create a signed JWT using the provided data, secret, and lifetime.
 * `expiresIn` follows jsonwebtoken's `SignOptions["expiresIn"]` typing (e.g. "1h").
 */
const generateToken = (
  payload: Record<string, unknown>,
  secret: Secret,
  expiresIn: SignOptions["expiresIn"]
) => {
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Validate a JWT and return the decoded payload.
 * Throws if the token is missing, expired, or malformed.
 */
const verifyToken = <T extends JwtPayload = JwtPayload>(
  token: string,
  secret: Secret
): T => {
  const decoded = jwt.verify(token, secret);
  if (typeof decoded === "string") {
    throw new Error("Invalid token payload");
  }
  return decoded as T;
};

export { generateToken, verifyToken };

