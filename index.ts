import EventSource from 'eventsource'
import asynciter from 'ministreamiterator'

const merge = <T>(value: T, patchType: string, patch: any): T => {
  switch (patchType) {
    case 'full-snapshot': return patch
    case 'update-keys': {
      // This just merges the two objects together.
      return {...value, ...patch}
    }
    default: {
      throw Error('Unknown patch type: ' + patchType)
      // return patch
    }
  }
}

export interface StateClientOptions {
  // emitPatch?: boolean
}

export default function listen(url: string, opts: StateClientOptions = {}) {
// const url = process.argv[2] || 'http://localhost:4040/raw/posts/bar'

// let verbose = true // TODO: Set me with command line flags
  let streamHeaders: {[k: string]: string} = {}

  let isFirst = true
  let value: any
  let patchType: 'full-snapshot' | 'update-keys' | string

  const es = new EventSource(url)
  const values = asynciter()

  es.onmessage = e => {
    const message = JSON.parse(e.data)
    let {headers, version, data} = message

    if (isFirst) {
      // TODO: Lowercase all values here.
      if (headers != null) streamHeaders = {...streamHeaders, ...headers}
      patchType = streamHeaders['patch-type'] || 'full-snapshot'
      value = data
      isFirst = false
    } else {
      value = merge(value, patchType, data)
    }
    
    values.append({value, patch: data, version})
  }

  return values
}
