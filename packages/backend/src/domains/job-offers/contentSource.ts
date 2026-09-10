export interface JobOfferContent {
  title: string | null;
  content: string | null;
}
export interface JobOfferContentSource {
  fetchContent(url: string): Promise<JobOfferContent | null>;
}
