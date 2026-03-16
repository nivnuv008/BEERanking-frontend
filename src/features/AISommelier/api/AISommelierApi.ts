import { API_BASE_URL, parseJsonResponse } from "../../../shared/api/apiClient";
import { fetchWithAuth } from "../../auth/api/authApi";

export type RecommendationType =
  | "SINGLE_BEST"
  | "MULTIPLE_GOOD"
  | "CLOSE_ALTERNATIVES"
  | "NO_MATCH";

export type SommelierAnalysis = {
  recommendationType: RecommendationType;
  explanation: string;
  topPickId: string | null;
  recommendedIds: string[];
};

export type SommelierBeer = {
  _id: string;
  name: string;
  brewery: string;
  style: string;
  abv: number;
  description?: string;
};

export type AskSommelierResponse = {
  analysis: SommelierAnalysis;
  beers: SommelierBeer[];
};

export async function askSommelier(
  prompt: string,
): Promise<AskSommelierResponse> {
  const response = await fetchWithAuth(`${API_BASE_URL}/beers/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  return parseJsonResponse<AskSommelierResponse>(
    response,
    "The sommelier could not process your request",
  );
}
