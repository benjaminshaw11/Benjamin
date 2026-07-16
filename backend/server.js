@@
 app.use('/api/admin', require('./src/routes/admin'));
+app.use('/api/phone', require('./src/routes/phoneOtp'));
@@
 sequelize.sync({ alter: true }).then(() => {
