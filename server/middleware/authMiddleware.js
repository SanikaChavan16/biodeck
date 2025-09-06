// // server/middleware/authMiddleware.js
// import jwt from "jsonwebtoken";
// import dotenv from "dotenv";
// dotenv.config();

// const JWT_SECRET = process.env.JWT_SECRET;

// export const requireAuth = (req, res, next) => {
//   try {
//     // 1) cookie token (httpOnly)
//     const cookieToken = req.cookies && req.cookies.token;

//     // 2) header token
//     const auth = req.headers.authorization;
//     const headerToken = auth && auth.startsWith("Bearer ") ? auth.split(" ")[1] : null;

//     const token = cookieToken || headerToken;
//     if (!token) return res.status(401).json({ message: "No token" });

//     const decoded = jwt.verify(token, JWT_SECRET);

//     // normalize req.user for downstream code
//     req.user = {
//       id: decoded.id || decoded._id || decoded.sub,
//       email: decoded.email,
//       companyId: decoded.companyId,
//       role: decoded.role || "user",
//       raw: decoded,
//     };

//     return next();
//   } catch (err) {
//     return res.status(401).json({ message: "Invalid or expired token" });
//   }
// };


// server/middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * requireAuth middleware
 * - Accepts a JWT from either:
 *    1) an httpOnly cookie named `token`
 *    2) Authorization header: "Bearer <token>"
 * - Verifies token and normalizes req.user for downstream handlers.
 *
 * Sets req.user = { id, email, companyId, role, raw }
 */
export const requireAuth = (req, res, next) => {
  try {
    // 1) cookie token (httpOnly)
    const cookieToken = req.cookies && req.cookies.token;

    // 2) header token
    const auth = req.headers.authorization;
    const headerToken = auth && auth.startsWith("Bearer ") ? auth.split(" ")[1] : null;

    const token = cookieToken || headerToken;
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // normalize req.user for downstream code
    req.user = {
      id: decoded.id || decoded._id || decoded.sub,
      email: decoded.email,
      companyId: decoded.companyId,
      role: decoded.role || "user",
      raw: decoded,
    };

    return next();
  } catch (err) {
    console.error("Auth error:", err.message || err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// default export for consumers that prefer default import
export default requireAuth;
