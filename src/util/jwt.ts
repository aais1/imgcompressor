import jwt from "jsonwebtoken";

export function decodeJWT(userId: string) {
  jwt.verify(userId, process.env.JWT_SECRET!, (err: any, decoded: any) => {
    if (err) {
      console.error("Error decoding JWT:", err);
      return null;
    }
    return decoded;
  });
}
