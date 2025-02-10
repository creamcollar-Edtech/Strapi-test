export default ({ env }) => ({
  'random-sort': {
        enabled: true,
      },
  upload: {
    config: {
      sizeLimit: 250 * 1024 * 1024, // 256mb in bytes
      providerOptions: {
        localServer: {
          maxage: 300000
        },
      },
      breakpoints: {
        xlarge: 1920,
        large: 1000,
        medium: 750,
        small: 500,
        xsmall: 64
      }
    },
  },
  'users-permissions': {
    config: {
      providers: {
        github: {
          enabled: true,
          icon: 'github',
          key: env('GITHUB_CLIENT_ID'),
          secret: env('GITHUB_CLIENT_SECRET'),
          callback: `${env('BASE_URL')}/api/auth/github/callback`,
          scope: ['read:user', 'user:email'],
        },
      },
    },
  },
});