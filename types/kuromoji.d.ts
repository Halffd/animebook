declare module 'kuromoji' {
  export interface KuromojiToken {
    surface_form: string;
    basic_form: string;
    reading: string;
    pos: string;
    pos_detail_1?: string;
    pos_detail_2?: string;
    pos_detail_3?: string;
    conjugated_type?: string;
    conjugated_form?: string;
    pronunciation?: string;
  }

  export interface KuromojiTokenizer {
    tokenize(text: string): KuromojiToken[];
  }

  export interface KuromojiBuilder {
    build(callback: (err: Error | null, tokenizer: KuromojiTokenizer) => void): void;
  }

  export function builder(options: { dicPath: string }): KuromojiBuilder;

  export default {
    builder
  };
} 