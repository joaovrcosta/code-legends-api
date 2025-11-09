import { User } from "@prisma/client";
import { IUsersRepository } from "../users-repository";
import { prisma } from "../../lib/prisma";
import bcrypt from "bcryptjs";

interface CreateUserData {
  name: string;
  email: string;
  password: string;
  avatar?: string | null;
}

export class PrismaUsersRepository implements IUsersRepository {
  async create(data: CreateUserData): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 6);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });

    return user;
  }

  async findByEmail(email: string) {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    return user;
  }

  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
    });
    return user;
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    // Filtrar apenas campos válidos do User e remover undefined
    // Excluir campos de relação e campos que não devem ser atualizados diretamente
    const excludedFields = [
      'id',
      'createdAt',
      'updatedAt',
      'userCourses',
      'userProgress',
      'Certificate',
      'favoriteCourses',
      'activeCourse',
      'coursesAsInstructor',
      'lessonsAsAuthor',
      'Address',
    ];

    const updateData: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && !excludedFields.includes(key)) {
        updateData[key] = value;
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });
    return user;
  }
}
