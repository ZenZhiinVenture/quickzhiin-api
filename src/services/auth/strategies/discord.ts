// TODO: Uncomment and implement the Discord strategy if needed
// import { Strategy as DiscordStrategy } from 'passport-discord';
// 
// export const discordStrategy = new DiscordStrategy(
//   {
//     clientID: process.env.DISCORD_CLIENT_ID!,
//     clientSecret: process.env.DISCORD_CLIENT_SECRET!,
//     callbackURL: `${process.env.CALLBACK_BASE_URL}/auth/discord/callback`,
//     scope: ['identify', 'email'],
//   },
//   async (accessToken, refreshToken, profile, done) => {
//     try {
//       const user = await corePrismaManager.getClient().user.findUnique({
//         where: { email: profile.email },
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
