const
  axios = require('axios'),
  {
    Readable,
    Transform
  } = require('stream'),
  baseURL = 'https://jarvischat.app';

function checkStatus(status, content) {
  if (status !== 'ok') {
    throw Error(content);
  } else {
    return status;
  }
}

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

    return checkStatus(status, content);
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
        line = chunk.trimRight(),
        index = line.indexOf(':');

      if (index <= 0) return;

      const field = line.substring(0, index);
      if (field !== 'data') return;

      const value = line.substring(index + 1).trimLeft();
      return value;
    }

    const
      transformed = data.pipe(new Transform({
        transform(chunk, encoding, callback) {
          callback(null, JSON.stringify(chunk.toString().split(/\n+|\r\n+|\r+/gm).filter(x => x)));
        }
      })),
      readableStream = new Readable({
        read(size) {
          return !0;
        }
      });

    transformed.on('data', chunk => {
      const res = JSON.parse(new TextDecoder().decode(chunk));
      res.map(x => readableStream.push(modifyChunk(x)));
    });
    
    transformed.on('end', () => readableStream.push(null));

    return readableStream;
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

    return checkStatus(status, content);
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

    return checkStatus(status, content);
  }
}
