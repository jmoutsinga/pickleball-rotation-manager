export class LocalStorageGateway {
  read(key, defaultValue) {
    const value = localStorage.getItem(key)
    return value === null ? defaultValue : JSON.parse(value)
  }

  write(key, value) {
    localStorage.setItem(key, JSON.stringify(value))
  }

  remove(key) {
    localStorage.removeItem(key)
  }
}

export default new LocalStorageGateway()
