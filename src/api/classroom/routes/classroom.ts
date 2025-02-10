export default {
    routes: [
      {
        method: 'GET',
        path: '/classroom/assignments',
        handler: 'classroom.getAssignments',
      },
      {
        method: 'GET',
        path: '/classroom/assignments/accepted',
        handler: 'classroom.getAcceptedAssignments',
        config: {
          auth: false, // Set to true if authentication is required
        },
      },
      {
        method: 'POST',
        path: '/classroom/webhook',
        handler: 'classroom.webhook',
        config: {
          auth: false, // No authentication for webhook
        },
      },
    ],
  };

  