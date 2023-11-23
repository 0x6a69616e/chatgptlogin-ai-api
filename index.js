const
  axios = require('axios'),
  {
    Readable,
    Transform
  } = require('stream');

function checkStatus(status, content) {
  if (status !== 'ok') {
    throw Error(content);
  } else {
    return status;
  }
}

module.exports = class {
  constructor(config = {}) {
    this.axios = axios.create(Object.assign(config, {
      baseURL: 'https://jarvischat.app',
      method: 'POST'
    }));
  }

  async new_chat(user_id = Array.from({
    length: 17
  }, () => Math.random().toString(36)[2]).join('')) {
    const {
      data: {
        id_
      }
    } = await this.axios({
      url: '/new_chat',
      data: JSON.stringify({
        user_id
      })
    });

    return id_;
  }

  async update_chat_name(chat_id, chat_name) {
    const {
      data: {
        status,
        content
      }
    } = await this.axios({
      url: '/update_chat_name',
      data: JSON.stringify({
        chat_id,
        chat_name
      })
    });

    return checkStatus(status, content);
  }

  async chat_api_stream(question, chat_id) {
    const {
      data
    } = await this.axios({
      url: '/chat_api_stream',
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

      return line.substring(index + 1).trimLeft();
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

    return {
      handler(callback = x => x) {
        return new Promise((resolve, reject) => {
          let response = [];
          readableStream.on('data', chunk => {
            const res = chunk.toString();
            !callback || callback(res);
            response.push(res);
          });
          readableStream.on('end', () => resolve(response));
          readableStream.on('error', reject);
        });
      },
      parsed: readableStream,
      raw: data
    };
  }

  async update_messages(chat_id, bot_response) {
    const {
      data: {
        status,
        content
      }
    } = await this.axios({
      url: '/update_messages',
      data: JSON.stringify({
        chat_id,
        bot_response,
        timestamp: Date.now()
      })
    });

    return checkStatus(status, content);
  }

  async delete_chat(chat_id) {
    const {
      data: {
        status,
        content
      }
    } = await this.axios({
      url: '/delete_chat',
      data: JSON.stringify({
        chat_id
      })
    });

    return checkStatus(status, content);
  }
}
