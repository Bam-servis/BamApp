function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  console.log("Authorization Header:", authHeader);
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      console.error("Token verification error:", err);
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
}
