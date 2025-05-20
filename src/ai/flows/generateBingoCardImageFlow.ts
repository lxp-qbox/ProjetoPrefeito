
'use server';
/**
 * @fileOverview A Genkit flow to generate an image of a 90-ball bingo card.
 *
 * - generateBingoCardImage - A function that generates a bingo card image.
 * - GenerateBingoCardImageInput - The input type for the function.
 * - GenerateBingoCardImageOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit/zod';

// Input Schema
export const GenerateBingoCardImageInputSchema = z.object({
  rows: z.array(z.array(z.union([z.number(), z.null()]))).length(3).refine(
    (rows) => rows.every(row => row.length === 9),
    { message: "Each of the 3 rows must have 9 columns." }
  ).describe("A 3x9 array representing the bingo card. Null for blank cells."),
  title: z.string().optional().describe("Optional title to display above the card."),
});
export type GenerateBingoCardImageInput = z.infer<typeof GenerateBingoCardImageInputSchema>;

// Output Schema
export const GenerateBingoCardImageOutputSchema = z.object({
  imageDataUri: z.string().describe("The generated image as a data URI."),
});
export type GenerateBingoCardImageOutput = z.infer<typeof GenerateBingoCardImageOutputSchema>;

// Helper function to format card data for the prompt
function formatCardDataForPrompt(rows: (number | null)[][]): string {
  return rows.map((row, rowIndex) =>
    `Linha ${rowIndex + 1}: ${row.map(cell => cell === null ? 'X' : cell.toString()).join(', ')}`
  ).join('\n');
}

export async function generateBingoCardImage(input: GenerateBingoCardImageInput): Promise<GenerateBingoCardImageOutput> {
  return generateBingoCardImageFlow(input);
}

const generateBingoCardImageFlow = ai.defineFlow(
  {
    name: 'generateBingoCardImageFlow',
    inputSchema: GenerateBingoCardImageInputSchema,
    outputSchema: GenerateBingoCardImageOutputSchema,
  },
  async (input) => {
    const imagePrompt = `
${input.title ? `Gere uma imagem com o seguinte título acima da tabela: "${input.title}".\n\n` : ''}Crie uma tabela estilizada com 3 linhas e 7 colunas, com os seguintes elementos de design:

Borda externa arredondada com contorno azul vibrante.

Células com efeito quadriculado: padrão alternado de preenchimento entre branco e azul-claro, como um tabuleiro de xadrez, começando com branco no canto superior esquerdo.

Células com sombra sutil ou destaque para dar leve profundidade.

Números centralizados em cada célula com tipografia moderna, limpa e sem serifa, todos em cor azul média, em negrito.

Espaçamento interno (padding) equilibrado para deixar os números bem centrados e legíveis.

Sem linhas internas visíveis entre as células, exceto pela alternância de cor para separação visual.

A imagem deve ter um estilo clean, minimalista e profissional, com foco na legibilidade e organização visual.

As proporções da tabela devem ser horizontais (mais larga que alta).

---
Dados da Cartela para renderizar (formato: 'X' para célula vazia):
${formatCardDataForPrompt(input.rows)}
---
Nota Importante: Os dados fornecidos acima são para uma grade de 3 linhas e 9 colunas. A solicitação de design é para "3 linhas e 7 colunas". Por favor, tente renderizar todos os 9 colunas de dados se possível, aplicando o estilo descrito. Se não for possível renderizar 9 colunas, adapte para 7 colunas da melhor forma, priorizando a clareza dos primeiros dados.
`;

    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp', // Experimental model for image generation
      prompt: imagePrompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'], // Must request IMAGE
      },
    });

    if (!media?.url) {
      throw new Error('Image generation failed or no image URL returned.');
    }

    return { imageDataUri: media.url };
  }
);
