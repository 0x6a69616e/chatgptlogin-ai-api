const
  axios = require('axios'),
  { Transform } = require('stream');

module.exports = class {
  static async new_chat(user_id) {
    const {
      data: {
        id_
      }
    } = await axios({
      url: 'https://jarvischat.app/new_chat',
      method: 'POST',
      data: JSON.stringify({
        user_id
      })
    });
    
    return id_;
  }
  
  static async chat_api_stream(question, chat_id) {
    const {
      data
    } = await axios({
      url: 'https://jarvischat.app/chat_api_stream',
      method: 'POST',
      responseType: 'stream',
      data: JSON.stringify({
        question,
        chat_id,
        timestamp: Date.now()
      })
    });

    function modifyChunk(chunk) {
      const
        line = new TextDecoder().decode(chunk).trimRight(),
        index = line.indexOf(':');

      if (index <= 0) return;

      const field = line.substring(0, index);
      if (field !== 'data') return;

      const value = line.substring(index + 1).trimLeft();
      return value;
    }

    return data.pipe(new Transform({
      transform(chunk, encoding, callback) {
        let modifiedChunk = modifyChunk(chunk);
        callback(null, modifiedChunk);
      }
    }))
  }
}
