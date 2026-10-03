import { Injectable } from '@nestjs/common';

import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class TestimonialsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly fullInclude = {
    translations: true,
  };

  findAll() {
    return this.prisma.testimonial.findMany({
      include: this.fullInclude,
      orderBy: { order: 'asc' },
    });
  }

  findActive() {
    return this.prisma.testimonial.findMany({
      where: { isActive: true },
      include: this.fullInclude,
      orderBy: { order: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.testimonial.findUnique({
      where: { id },
      include: this.fullInclude,
    });
  }

  findByKey(key: string) {
    return this.prisma.testimonial.findUnique({
      where: { key },
      include: this.fullInclude,
    });
  }

  create(data: Prisma.TestimonialCreateInput) {
    return this.prisma.testimonial.create({
      data,
      include: this.fullInclude,
    });
  }

  update(id: string, data: Prisma.TestimonialUpdateInput) {
    return this.prisma.testimonial.update({
      where: { id },
      data,
      include: this.fullInclude,
    });
  }

  delete(id: string) {
    return this.prisma.testimonial.delete({ where: { id } });
  }

  async replaceTranslations(
    testimonialId: string,
    translations: {
      locale: string;
      quote: string;
      author: string;
      company: string;
    }[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.testimonialTranslation.deleteMany({
        where: { testimonialId },
      });
      await tx.testimonialTranslation.createMany({
        data: translations.map((t) => ({
          testimonialId,
          locale: t.locale,
          quote: t.quote,
          author: t.author,
          company: t.company,
        })),
      });
    });
  }
}