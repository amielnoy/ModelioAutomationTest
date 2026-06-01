/** JSONPlaceholder domain types */

export interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

export interface CreatePostPayload {
  userId: number;
  title: string;
  body: string;
}

export interface UpdatePostPayload extends Partial<CreatePostPayload> {}
