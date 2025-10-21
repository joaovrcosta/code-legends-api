import { Course } from "@prisma/client";

interface CreateCourseData {
  title: string;
  slug: string;
  description: string;
  level: string;
  instructorId: string;
  thumbnail?: string | null;
  icon?: string | null;
  tags?: string[];
  isFree?: boolean;
  active?: boolean;
  releaseAt?: Date | null;
}

export interface ICourseRepository {
  create(data: CreateCourseData): Promise<Course>;
  findBySlug(slug: string): Promise<Course | null>;
}
