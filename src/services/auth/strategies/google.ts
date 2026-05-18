// TODO: Uncomment and implement the Google OAuth strategy
// import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
// 
// export const googleStrategy = new GoogleStrategy(
//   {
//     clientID: process.env.GOOGLE_CLIENT_ID!,
//     clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
//     callbackURL: `${process.env.CALLBACK_BASE_URL}/auth/google/callback`,
//     scope: ['profile', 'email'],
//   },
//   async (accessToken, refreshToken, profile, done) => {
//     try {
//       const user = await corePrismaManager.getClient().user.findUnique({
//         where: { email: profile.emails?.[0].value },
//       });

//       if (!user) {
//         return done(new Error('User not found. Do you want to create an account?'));
//       }

//       const token: Express.User = {
//         userId: Number(user.id),
//         email: user.email || '',
//         currentTenantId: Number(user.defaultTenantId),
//         discordAccessToken: accessToken,
//         discordRefreshToken: refreshToken,
//         roleId: 0,
//         permissions: [],
//       };

//       done(null, token);
//     } catch (error) {
//       done(error as Error);
//     }
//   }
// );
