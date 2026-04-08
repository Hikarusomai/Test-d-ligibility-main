// Middleware pour vérifier le rôle admin
const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Accès refusé - Administrateur requis'
        });
    }
};

module.exports = requireAdmin;
