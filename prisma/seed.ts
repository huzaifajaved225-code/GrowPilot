import { PrismaClient, Plan, OrgRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);

  const owner = await prisma.user.upsert({
    where: { email: "owner@growpilot.dev" },
    update: {},
    create: {
      name: "GrowPilot Owner",
      email: "owner@growpilot.dev",
      passwordHash,
      emailVerified: new Date(),
    },
  });

  const organization = await prisma.organization.upsert({
    where: { slug: "growpilot-demo" },
    update: {},
    create: {
      name: "GrowPilot Demo Agency",
      slug: "growpilot-demo",
      plan: Plan.AGENCY,
      memberships: {
        create: {
          userId: owner.id,
          role: OrgRole.OWNER,
        },
      },
    },
  });

  const project = await prisma.project.upsert({
    where: { id: "demo-project-seed-id" },
    update: {},
    create: {
      id: "demo-project-seed-id",
      organizationId: organization.id,
      name: "Demo Client Website",
      websiteUrl: "https://example.com",
      industry: "Home & Décor",
    },
  });

  console.log("Seed complete:");
  console.log({
    ownerEmail: owner.email,
    organizationSlug: organization.slug,
    projectId: project.id,
  });
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
