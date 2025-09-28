export interface User {
  readonly id: string
  readonly email: string
  readonly displayName: string
  readonly createdAt: Date
  readonly lastLoginAt?: Date
}

export const createUser = (
  id: string,
  email: string,
  displayName: string
): User => ({
  id,
  email,
  displayName,
  createdAt: new Date()
})

export const updateUser = (
  user: User,
  updates: Partial<Pick<User, 'displayName' | 'lastLoginAt'>>
): User => ({
  ...user,
  ...updates
})

export const getPublicUserInfo = (user: User) => ({
  id: user.id,
  displayName: user.displayName
})
