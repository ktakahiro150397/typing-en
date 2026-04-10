import type { User } from '@prisma/client'

declare module '@fastify/passport' {
  interface PassportUser extends User {}
}
