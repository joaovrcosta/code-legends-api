import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const categories = [
    {
      name: "Front-end",
      slug: "front-end",
      description: "Desenvolvimento de interfaces e experiência do usuário",
      icon: "💻",
      color: "#3B82F6",
      order: 1,
    },
    {
      name: "Back-end",
      slug: "back-end",
      description: "Desenvolvimento de APIs e lógica de servidor",
      icon: "⚙️",
      color: "#10B981",
      order: 2,
    },
    {
      name: "Design",
      slug: "design",
      description: "Design UI/UX e interfaces visuais",
      icon: "🎨",
      color: "#EC4899",
      order: 3,
    },
    {
      name: "Inglês",
      slug: "ingles",
      description: "Aprendizado de idiomas",
      icon: "🗣️",
      color: "#F59E0B",
      order: 4,
    },
    {
      name: "Empreendedorismo",
      slug: "empreendedorismo",
      description: "Negócios e gestão",
      icon: "💼",
      color: "#8B5CF6",
      order: 5,
    },
    {
      name: "DevOps",
      slug: "devops",
      description: "Infraestrutura, deploy e automação",
      icon: "🚀",
      color: "#06B6D4",
      order: 6,
    },
    {
      name: "Mobile",
      slug: "mobile",
      description: "Desenvolvimento de aplicativos móveis",
      icon: "📱",
      color: "#F97316",
      order: 7,
    },
    {
      name: "Data Science",
      slug: "data-science",
      description: "Ciência de dados e análise",
      icon: "📊",
      color: "#14B8A6",
      order: 8,
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }

  console.log("✅ Categories seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
