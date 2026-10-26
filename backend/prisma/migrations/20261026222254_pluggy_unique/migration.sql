/*
  Warnings:

  - A unique constraint covering the columns `[item_id_pluggy]` on the table `consentimento` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[codigo_pluggy]` on the table `instituicao` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "consentimento_item_id_pluggy_key" ON "consentimento"("item_id_pluggy");

-- CreateIndex
CREATE UNIQUE INDEX "instituicao_codigo_pluggy_key" ON "instituicao"("codigo_pluggy");
