// TODO : Refactor this file to use the new authentication system
// import passport from 'passport';
// import { googleStrategy } from './strategies/google';
// import { discordStrategy } from './strategies/discord';

// import { CorePrismaClientManager } from './utils/prisma/coreClient';
// 
// const prismaManager = CorePrismaClientManager.getInstance();

// passport.use(googleStrategy);
// passport.use(discordStrategy);

// passport.serializeUser((user: Express.User, done) => {
//   done(null, user);
// });

// passport.deserializeUser(async (id: number, done) => {
//   try {
//     const user = await prismaManager.getClient().user.findUnique({ where: { id } });

//     if (!user) {
//       return done(new Error('User not found'));
//     }

//     const tenantDB = prisma);

//     // Find User Role and permissions
//     const tenantUser = await tenantDB.user.findUnique({
//       where: { email: user.email },
//     });

//     const tenantPermissions = await tenantDB.rolePermission.findMany({
//       where: { roleId: tenantUser?.roleId },
//       include: {
//         permission: {
//           select: {
//             name: true,
//           },
//         },
//       },
//     });

//     const token: Express.User = {
//       userId: Number(user?.id),
//       email: user?.email || '',
//       currentTenantId: Number(user?.defaultTenantId),
//       roleId: Number(tenantUser?.roleId),
//       permissions: tenantPermissions.map(data => data.permission.name),
//     };
//     done(null, token);
//   } catch (error) {
//     done(error);
//   }
// });

// export default passport;
