const
  axios = require('axios'),
  { Transform } = require('stream'),  
  baseURL = 'https://jarvischat.app';

module.exports = class {
  static async new_chat(user_id) {
    const {
      data: {
        id_
      }
    } = await axios({
      url: baseURL + '/new_chat',
      method: 'POST',
      data: JSON.stringify({
        user_id
      })
    });
    
    return id_;
  }

  static async update_chat_name(chat_id, chat_name) {
    const {
      data: {
        status,
        content
      }
    } = await axios({
      url: baseURL + '/update_chat_name',
      method: 'POST',
      data: JSON.stringify({
        chat_id,
        chat_name
      })
    });

    if (status !== 'ok') {
      throw Error(content);
    } else {
      return status;
    } 
  }

  static async chat_api_stream(question, chat_id) {
    const {
      data
    } = await axios({
      url: baseURL + '/chat_api_stream',
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

  static async update_messages(chat_id, bot_response) {
    const {
      data: {
        status,
        content
      }
    } = await axios({
      url: baseURL + '/update_messages',
      method: 'POST',
      data: JSON.stringify({
        chat_id,
        bot_response,
        timestamp: Date.now()
      })
    });
  
    if (status !== 'ok') {
      throw Error(content);
    } else {
      return status;
    }
  }

  static async delete_chat(chat_id) {
    const {
      data: {
        status,
        content
      }
    } = await axios({
      url: baseURL + '/delete_chat',
      method: 'POST',
      data: JSON.stringify({
        chat_id
      })
    });

    if (status !== 'ok') {
      throw Error(content);
    } else {
      return status;
    }
  }
}
