-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "categoryName" TEXT NOT NULL,
    "categoryCode" TEXT,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
