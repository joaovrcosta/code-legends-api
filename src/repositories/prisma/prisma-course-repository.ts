import { Course } from "@prisma/client";
import { ICourseRepository } from "../course-repository";
import { prisma } from "../../lib/prisma";

interface CreateCourseData {
  title: string;
  slug: string;
  description: string;
  level: string;
  instructorId: string;
  categoryId?: string | null;
  thumbnail?: string | null;
  icon?: string | null;
  tags?: string[];
  isFree?: boolean;
  active?: boolean;
  releaseAt?: Date | null;
}

export class PrismaCourseRepository implements ICourseRepository {
  async create(data: CreateCourseData): Promise<Course> {
    const course = await prisma.course.create({
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        level: data.level,
        instructorId: data.instructorId,
        categoryId: data.categoryId ?? null,
        thumbnail: data.thumbnail ?? null,
        icon: data.icon ?? null,
        tags: data.tags ?? [],
        isFree: data.isFree ?? false,
        active: data.active ?? true,
        releaseAt: data.releaseAt ?? new Date(),
      },
    });

    return course;
  }

  async findBySlug(slug: string): Promise<Course | null> {
    const course = await prisma.course.findUnique({
      where: {
        slug,
      },
    });

    return course;
  }
}
