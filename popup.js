let allCoinsWithInfo = {}
let coinsStorage = []

const user = new User()

function User() {

  this.coinsAndInfo = {}

  this.hasAllCoinInfos = () => Object.keys(this.jsonCoins()).length === Object.keys(this.coinsAndInfo).length
  this.hasCoins        = () => !!localStorage.getItem('coins')
  this.coins           = () => localStorage.getItem('coins') 
  this.jsonCoins       = () => JSON.parse(localStorage.getItem('coins'))
  this.hasCoin         = (coin) => !!JSON.parse(this.coins()) ? !!JSON.parse(this.coins())[coin] : false
  
  this.addCoin = async (coin) => {
      let coinsCollection = JSON.parse(this.coins())

      const coinInfo = await getCoinInfo(coin)

      coinsCollection = Object.assign({}, coinsCollection, {[coin]: coinInfo})

      localStorage.setItem('coins', JSON.stringify(coinsCollection))
  }

  this.removeCoin = (coin) => {
      const coinsCollection = Object.assign({}, JSON.parse(this.coins()))

      delete coinsCollection[coin]

      if (Object.keys(JSON.parse(user.coins())).length === 0) {
        localStorage.removeItem('coins')
      }
      else {
        localStorage.setItem('coins', JSON.stringify(coinsCollection))
      }
  }
}

function _cleanedCoinInfo(coinInfo) {
  coinInfo.long = coinInfo.display_name
  coinInfo.short = coinInfo.id
  return coinInfo
}

function renderUserCoins(htmlElements) {
  htmlElements.coinsUl.innerHTML = coinsListRender(Object.values(user.jsonCoins()))
}


function getCoinInfo(coin) {
  return fetch(`http://coincap.io/page/${coin}`)
  .then(res => res.json())
  .then(coinInfo => {
    user.coinsAndInfo[coinInfo.id] = coinInfo.id
    return _cleanedCoinInfo(coinInfo)
  })
}

function coinsListRender(coins) {
  const coinsList = coins.map(coin => {
    return (`
        <li id="${coin.long}-li" class="coin-li ${user.hasCoin(coin.short) ? 'selected' : ''}">
          <div class="coin-info-container">
            <div class="coin-name-container">
              <div class="coin-name-short">${coin.short}</div>
              <div class="coin-name">${coin.long}</div>
            </div>
            <div class="coin-price-container">
              <div class="actions-container">
                <div class="actions">
                  <a>
                    <icon class="action ${user.hasCoin(coin.short) ? 'remove' : 'add'} fa fa-${user.hasCoin(coin.short) ? 'minus' : 'plus'}-square-o" id="${coin.short}"></icon>
                  </a>
                </div>
              </div>
              <div class="coin-price">$${coin.price}</div>
            </div>
          </div>
        </li>
    `)
  })
  return coinsList.join("")
}

function getCoinsAvailable(coinsUl) {
  if (coinsStorage.length === 0) {
    fetch(`http://coincap.io/front`)
    .then(res => res.json())
    .then(coins => {
      coinsStorage = coins
      console.log("coins ta", coinsStorage)
    })
  }
}

function renderCoins(inputValue, coinsUl) {
  const coinsToBeRendered = coinsStorage.filter(coin => {
    if (coin.long && coin.short) {
      return !!coin.long.toLowerCase().includes(inputValue.toLowerCase()) || !!coin.short.toLowerCase().includes(inputValue.toLowerCase())
    }
  })
  coinsUl.innerHTML = coinsListRender(coinsToBeRendered)
}
 
function addAllEventListeners(htmlElements) {
  htmlElements.coinsUl.onclick = (e) => {

    if (e.target.className.includes('action add')) {
      user.addCoin(e.target.id)
      .then(() =>
        renderCoins(htmlElements.searchInput.value, htmlElements.coinsUl)
      )
    }

    else if (e.target.className.includes('action remove')) {
      user.removeCoin(e.target.id)
      if (htmlElements.coinsUl.className.includes('user-ul')) {
        renderUserCoins(htmlElements)
      }
      else {
        renderCoins(htmlElements.searchInput.value, htmlElements.coinsUl)
      }
    }
  }

  htmlElements.searchInput.onkeyup = (e) => {
    if (e.target.value.length > 0) {
      htmlElements.coinsUl.className = "coins-ul"
      renderCoins(e.target.value, htmlElements.coinsUl)
    }
    else {
      htmlElements.coinsUl.className = "coins-ul user-ul"
      renderUserCoins(htmlElements)
    }
  }
}


document.addEventListener('DOMContentLoaded', function () {
  const coinsContainer     = document.getElementById('coins-info-container')
  const coinsMenuContainer = document.getElementById('coins-menu-container')
  const coinsUl            = document.getElementById('coins-ul')
  const searchInput        = document.getElementById('search-coin-input')

  const htmlElements = {coinsContainer, coinsMenuContainer, coinsUl, searchInput}

  addAllEventListeners(htmlElements)

  if (user.hasCoins()) {
    Object.keys(user.jsonCoins()).forEach(coin => {
      getCoinInfo(coin)
      .then(() => {
        if (user.hasAllCoinInfos()) getCoinsAvailable(coinsUl)
      })
    })
    renderUserCoins(htmlElements)
    
  }
  else {
    getCoinsAvailable(coinsUl)
  }
});
