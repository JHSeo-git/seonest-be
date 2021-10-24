import Joi from 'joi';
import { Context } from 'koa';
import markdownToText from 'markdown-to-text';

export const validateBodySchema = async (ctx: Context, schema: Joi.Schema) => {
  const result = await schema.validateAsync(ctx.request.body);
  if (result.error) {
    ctx.status = 400;
    ctx.body = {
      name: 'WrongBodySchema',
      payload: result.error,
    };
    return false;
  }
  return true;
};

export const generateUrlSlug = (text: string) => {
  // 한글 unicode: /[\u3131-\u314e|\u314f-\u3163|\uac00-\ud7a3]/g
  // default regex : /[0-9a-zA-Z. -]/g
  const invalidCharRegex = /[^0-9a-zA-Z.\u3131-\u314e\u314f-\u3163\uac00-\ud7a3 -]/g;
  return text
    .replace(invalidCharRegex, '')
    .replace(/ /g, '-')
    .replace(/--+/g, '-');
};

const WORDS_PER_MINUTE_ENG = 200;
const WORDS_PER_MINUTE_KOR = 500;
const IMG_READ_TIME_SEC = 12;

const countImages = (markdown: string) => {
  const imgRegex = /\!\[(.*?)\][\[\(].*?[\]\)]/g;
  return (markdown.match(imgRegex) ?? []).length;
};

const calculateImageReadTime = (imgCount: number) => {
  if (imgCount === 0) return 0;

  let seconds = 0;

  if (imgCount > 10) {
    seconds = (imgCount / 2) * (IMG_READ_TIME_SEC + 3) + (imgCount - 10) * 3;
  } else {
    seconds = (imgCount / 2) * (IMG_READ_TIME_SEC * 2 + (imgCount - 1) * -1);
  }

  return seconds / 60;
};

const calculateMarkdownReadTime = (markdown: string) => {
  const plainText = markdownToText(markdown);

  // const korPattern =
  //   '[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]+';
  // const korRegex = new RegExp(korPattern, 'g');
  const korRegex = /[가-힣]+/g;
  const engRegex = /\w+/g;

  const removedKor = plainText.replace(korRegex, '');

  const korReadTime =
    (plainText.match(korRegex) ?? []).length / WORDS_PER_MINUTE_KOR;
  const engReadTime =
    (removedKor.match(engRegex) ?? []).length / WORDS_PER_MINUTE_ENG;

  return korReadTime + engReadTime;
};

export const getReadTime = (markdown: string) => {
  const imgCount = countImages(markdown);

  const textReadTime = calculateMarkdownReadTime(markdown);
  const imgReadTime = calculateImageReadTime(imgCount);

  return textReadTime + imgReadTime;
};
