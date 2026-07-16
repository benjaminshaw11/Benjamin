@@
 router.get('/pending', checkAdmin, controller.listPending);
 router.post('/admin/:id/approve', checkAdmin, controller.approve);
 router.post('/admin/:id/reject', checkAdmin, controller.reject);
+router.get('/:id/matches', checkAdmin, controller.getMatches);
+router.post('/admin/:id/accept-match', checkAdmin, controller.acceptMatch);
