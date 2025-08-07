-- AlterTable
ALTER TABLE "Textbook" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Textbook" ADD COLUMN "accessCode" TEXT;

-- CreateTable
CREATE TABLE "GuestAccess" (
    "id" TEXT NOT NULL,
    "textbookId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestStudyRecord" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "timeSpent" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestStudyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestChatMessage" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "role" "ChatRole" NOT NULL,
    "content" TEXT NOT NULL,
    "context" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GuestAccess_sessionId_key" ON "GuestAccess"("sessionId");

-- CreateIndex
CREATE INDEX "GuestAccess_textbookId_studentId_idx" ON "GuestAccess"("textbookId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Textbook_accessCode_key" ON "Textbook"("accessCode");

-- AddForeignKey
ALTER TABLE "GuestAccess" ADD CONSTRAINT "GuestAccess_textbookId_fkey" FOREIGN KEY ("textbookId") REFERENCES "Textbook"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestStudyRecord" ADD CONSTRAINT "GuestStudyRecord_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "GuestAccess"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestChatMessage" ADD CONSTRAINT "GuestChatMessage_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "GuestAccess"("id") ON DELETE RESTRICT ON UPDATE CASCADE;