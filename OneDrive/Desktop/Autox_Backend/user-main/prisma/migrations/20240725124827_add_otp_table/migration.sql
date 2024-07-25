-- CreateTable
CREATE TABLE "otps" (
    "id" SERIAL NOT NULL,
    "mobile_number" INTEGER NOT NULL,
    "otp" INTEGER NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "otps_mobile_number_key" ON "otps"("mobile_number");
