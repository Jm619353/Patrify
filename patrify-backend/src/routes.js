const express = require('express');
const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
const patrimonyRoutes = require('./modules/patrimony/patrimony.routes');
const { publicRouter: publicPatrimonyRoutes } = require('./modules/patrimony/patrimony.routes');
const maintenanceRoutes = require('./modules/maintenance/maintenance.routes');
const loanRoutes = require('./modules/loans/loan.routes');
const insuranceRoutes = require('./modules/insurances/insurance.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const discardRoutes = require('./modules/discard/discard.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/patrimonies', patrimonyRoutes);
router.use('/public/patrimonies', publicPatrimonyRoutes);
router.use('/maintenances', maintenanceRoutes);
router.use('/loans', loanRoutes);
router.use('/insurances', insuranceRoutes);
router.use('/admin', adminRoutes);
router.use('/discard-points', discardRoutes);

module.exports = router;
