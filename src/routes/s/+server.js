import { json } from '@sveltejs/kit';
import natural from 'natural';
import Sentiment from 'sentiment';
import stopwords from "stopwords-iso"
import NodeCache from "node-cache";

const score_cache = new NodeCache({ stdTTL: 600 });
const en_stop = stopwords.en

export async function POST({request}) {

    const { post,key } = await request.json();

    if (key!=process.env.KEY || key==undefined || post == "undefined") {
        return json({})
    }

    if (post in score_cache) {
        return json(score_cache[post])
    }

    const sentiment = new Sentiment();
    const tokenizer = new natural.WordTokenizer();
  
    const sentimentScore = sentiment.analyze(post);
    const tokens = tokenizer.tokenize(post);
    
    // Remove stop words
    const stopwords = en_stop;
    const filteredTokens = tokens.filter(token => !stopwords.includes(token.toLowerCase()));
    
    
    let keywords = Object.keys(filteredTokens.reduce((acc, word) => (acc[word] = (acc[word] || 0) + 1, acc), {})).sort((a, b) => filteredTokens.filter(word => word === b).length - filteredTokens.filter(word => word === a).length).slice(0, 3);

    const data = {
        "text":post,
        "keywords":keywords,
        "sentiment":sentimentScore,
    }

    score_cache[post] = data

    return json(data)
}
