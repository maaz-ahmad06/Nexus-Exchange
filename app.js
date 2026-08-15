/* ==========================================================================
   Nexus Exchange Main Application Script
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // Core Mock Database of Coins
    const coinData = [
        { id: 'btc', name: 'Bitcoin', symbol: 'BTC', price: 63240.50, change: 2.45, cap: '1.24T', volume: '28.4B', icon: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png', SparklineData: [62100, 62300, 62000, 62800, 63100, 62900, 63240] },
        { id: 'eth', name: 'Ethereum', symbol: 'ETH', price: 3495.20, change: 1.12, cap: '420.5B', volume: '15.2B', icon: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', SparklineData: [3450, 3480, 3440, 3460, 3510, 3470, 3495] },
        { id: 'sol', name: 'Solana', symbol: 'SOL', price: 143.85, change: 8.92, cap: '66.8B', volume: '3.8B', icon: 'https://assets.coingecko.com/coins/images/4128/small/solana.png', SparklineData: [130, 134, 132, 137, 140, 139, 143.85] },
        { id: 'bnb', name: 'Binance Coin', symbol: 'BNB', price: 582.40, change: -0.65, cap: '85.4B', volume: '1.9B', icon: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png', SparklineData: [590, 588, 584, 586, 583, 585, 582.40] },
        { id: 'ada', name: 'Cardano', symbol: 'ADA', price: 0.485, change: -2.31, cap: '17.3B', volume: '410M', icon: 'https://assets.coingecko.com/coins/images/975/small/cardano.png', SparklineData: [0.50, 0.495, 0.498, 0.49, 0.488, 0.487, 0.485] },
        { id: 'dot', name: 'Polkadot', symbol: 'DOT', price: 6.28, change: 3.14, cap: '8.9B', volume: '180M', icon: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png', SparklineData: [6.05, 6.12, 6.08, 6.15, 6.22, 6.20, 6.28] }
    ];

    // Fiat rates relative to USD (USD is our base)
    const fiatRates = {
        USD: 1
    };

    /* ==========================================================================
       Preloader Percentage Control (Exactly 2.5 - 3 Seconds)
       ========================================================================== */
    const preloader = document.getElementById('preloader');
    const fillBar = document.querySelector('.loader-bar-fill');
    const counter = document.querySelector('.loader-counter');
    
    let loadProgress = 0;
    const duration = 2500; // 2.5 seconds
    const intervalTime = 25; // Update every 25ms
    const step = 100 / (duration / intervalTime);

    const loadTimer = setInterval(() => {
        loadProgress += step;
        if (loadProgress >= 100) {
            loadProgress = 100;
            clearInterval(loadTimer);
            
            // Trigger preloader fadeout
            setTimeout(() => {
                preloader.classList.add('fade-out');
                // Initiate page reveals once page is interactive
                initScrollReveal();
            }, 200);
        }
        
        fillBar.style.width = `${Math.floor(loadProgress)}%`;
        counter.textContent = `${Math.floor(loadProgress)}%`;
    }, intervalTime);


    /* ==========================================================================
       Sticky Header Controls
       ========================================================================== */
    const header = document.getElementById('main-header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 60) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        // Active Nav links based on sections
        highlightNavLinks();
    });


    /* ==========================================================================
       Hamburger Navigation Menu Control (Mobile Responsive)
       ========================================================================== */
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    hamburgerBtn.addEventListener('click', () => {
        hamburgerBtn.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close menu when a link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburgerBtn.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Highlight menu links during scroll
    function highlightNavLinks() {
        const scrollPosition = window.scrollY + 120; // offset header height
        
        document.querySelectorAll('section, footer').forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }


    /* ==========================================================================
       Market Rates Population & Custom SVG Sparkline Construction
       ========================================================================== */
    const marketTableBody = document.getElementById('market-table-body');
    const tabBtns = document.querySelectorAll('.tab-btn');
    let currentFilter = 'all';

    function buildSparkline(data, positive) {
        const width = 100;
        const height = 35;
        const padding = 2;
        
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min === 0 ? 1 : max - min;
        
        const points = data.map((val, idx) => {
            const x = (idx / (data.length - 1)) * (width - padding * 2) + padding;
            const y = height - ((val - min) / range) * (height - padding * 2) - padding;
            return `${x},${y}`;
        }).join(' ');

        const strokeColor = positive ? 'var(--color-green)' : 'var(--color-red)';
        
        return `
            <svg class="sparkline-svg" viewBox="0 0 ${width} ${height}">
                <polyline class="sparkline-line" fill="none" stroke="${strokeColor}" stroke-width="2" points="${points}" />
            </svg>
        `;
    }

    function renderMarketTable() {
        marketTableBody.innerHTML = '';
        
        let filteredCoins = [...coinData];
        if (currentFilter === 'gainers') {
            filteredCoins = filteredCoins.filter(coin => coin.change > 0).sort((a, b) => b.change - a.change);
        } else if (currentFilter === 'losers') {
            filteredCoins = filteredCoins.filter(coin => coin.change < 0).sort((a, b) => a.change - b.change);
        }

        filteredCoins.forEach(coin => {
            const isPositive = coin.change >= 0;
            const tr = document.createElement('tr');
            tr.setAttribute('data-id', coin.id);
            
            tr.innerHTML = `
                <td>
                    <div class="market-coin-cell">
                        <img src="${coin.icon}" alt="${coin.name} Icon">
                        <div class="coin-name-info">
                            <strong>${coin.name}</strong>
                            <span>${coin.symbol}</span>
                        </div>
                    </div>
                </td>
                <td class="market-price-cell" id="price-${coin.id}">
                    $${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </td>
                <td class="market-change-cell ${isPositive ? 'positive' : 'negative'}" id="change-${coin.id}">
                    ${isPositive ? '+' : ''}${coin.change.toFixed(2)}%
                </td>
                <td class="market-cap-cell">${coin.cap}</td>
                <td class="market-vol-cell">${coin.volume}</td>
                <td class="table-chart-cell">
                    ${buildSparkline(coin.SparklineData, isPositive)}
                </td>
                <td>
                    <button class="btn btn-secondary btn-trade" data-asset="${coin.symbol}">Trade</button>
                </td>
            `;
            marketTableBody.appendChild(tr);
        });

        // Add action link listener to trade buttons
        document.querySelectorAll('.btn-trade').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const asset = e.target.getAttribute('data-asset');
                const swapToSelect = document.getElementById('swap-to-asset');
                const swapFromSelect = document.getElementById('swap-from-asset');

                swapFromSelect.value = 'USD';
                swapToSelect.value = asset;
                
                // Scroll to converter section
                document.getElementById('converter').scrollIntoView({ behavior: 'smooth' });
                calculateSwap();
            });
        });
    }

    // Filter Navigation Tabs
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tabBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.getAttribute('data-filter');
            renderMarketTable();
        });
    });


    /* ==========================================================================
       Live Tickers Updates (Simulating Real Time Shifts)
       ========================================================================== */
    setInterval(() => {
        if (coinData.length === 0) return;

        // Choose a random coin to tick
        const randomIndex = Math.floor(Math.random() * coinData.length);
        const coin = coinData[randomIndex];
        
        // Generate minor fluctuation between -0.6% and +0.6%
        const fluctuation = (Math.random() * 1.2 - 0.6) / 100;
        const oldPrice = coin.price;
        coin.price = oldPrice * (1 + fluctuation);
        
        // Adjust the 24h change value slightly
        coin.change += (fluctuation * 100);
        
        // Slide standard chart points array
        coin.SparklineData.push(coin.price);
        coin.SparklineData.shift();

        // Update elements locally on UI
        const priceCell = document.getElementById(`price-${coin.id}`);
        const changeCell = document.getElementById(`change-${coin.id}`);
        
        if (priceCell && changeCell) {
            const isPositive = coin.change >= 0;
            priceCell.textContent = `$${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
            changeCell.textContent = `${isPositive ? '+' : ''}${coin.change.toFixed(2)}%`;
            
            // Adjust positive/negative color classes
            if (isPositive) {
                changeCell.className = 'market-change-cell positive';
            } else {
                changeCell.className = 'market-change-cell negative';
            }

            // Flash effect based on movement direction
            if (fluctuation >= 0) {
                priceCell.classList.add('flash-up');
                setTimeout(() => priceCell.classList.remove('flash-up'), 800);
            } else {
                priceCell.classList.add('flash-down');
                setTimeout(() => priceCell.classList.remove('flash-down'), 800);
            }
            
            // Update sparkline chart column in row
            const tr = priceCell.parentElement;
            if (tr) {
                const chartCell = tr.querySelector('.table-chart-cell');
                if (chartCell) {
                    chartCell.innerHTML = buildSparkline(coin.SparklineData, isPositive);
                }
            }
        }
        
        // Recalculate converter rate display details if the active tokens are impacted
        calculateSwap();

    }, 3000);


    /* ==========================================================================
       Interactive Converter / Swap Calculator Widget
       ========================================================================== */
    const swapFromInput = document.getElementById('swap-from-amount');
    const swapToInput = document.getElementById('swap-to-amount');
    const swapFromAsset = document.getElementById('swap-from-asset');
    const swapToAsset = document.getElementById('swap-to-asset');
    const swapSwitchBtn = document.getElementById('swap-switch-btn');
    const exchangeRateText = document.getElementById('exchange-rate-text');
    const swapExecuteBtn = document.getElementById('swap-execute-btn');

    // Get asset pricing in USD
    function getAssetUSDPrice(symbol) {
        if (symbol === 'USD') return 1;
        const match = coinData.find(c => c.symbol === symbol);
        return match ? match.price : 1;
    }

    function calculateSwap() {
        const fromAsset = swapFromAsset.value;
        const toAsset = swapToAsset.value;
        const amount = parseFloat(swapFromInput.value);

        if (isNaN(amount) || amount <= 0) {
            swapToInput.value = '0.00';
            exchangeRateText.textContent = `1 ${fromAsset} = 0.00 ${toAsset}`;
            return;
        }

        const priceFrom = getAssetUSDPrice(fromAsset);
        const priceTo = getAssetUSDPrice(toAsset);

        // Convert From token to USD, then USD to Target token
        const totalUSD = amount * priceFrom;
        const finalAmount = totalUSD / priceTo;

        swapToInput.value = finalAmount.toLocaleString(undefined, { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 6 
        });

        // Exchange Rate details text
        const singleRate = priceFrom / priceTo;
        exchangeRateText.textContent = `1 ${fromAsset} = ${singleRate.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${toAsset}`;
    }

    // Swapping selectors
    swapSwitchBtn.addEventListener('click', () => {
        const temp = swapFromAsset.value;
        swapFromAsset.value = swapToAsset.value;
        swapToAsset.value = temp;
        
        // Swap inputs value to look reactive
        const fromVal = parseFloat(swapFromInput.value);
        const toVal = parseFloat(swapToInput.value.replace(/,/g, ''));
        
        if (!isNaN(toVal) && toVal > 0) {
            swapFromInput.value = toVal;
        }

        calculateSwap();
    });

    // Inputs trigger calculation
    swapFromInput.addEventListener('input', calculateSwap);
    swapFromAsset.addEventListener('change', calculateSwap);
    swapToAsset.addEventListener('change', calculateSwap);

    // Swap Execution simulation triggers
    swapExecuteBtn.addEventListener('click', () => {
        const amount = parseFloat(swapFromInput.value);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount.');
            return;
        }

        swapExecuteBtn.disabled = true;
        swapExecuteBtn.textContent = 'Processing Swap...';
        
        setTimeout(() => {
            alert(`Successfully swapped ${amount} ${swapFromAsset.value} for ${swapToInput.value} ${swapToAsset.value}!`);
            swapExecuteBtn.disabled = false;
            swapExecuteBtn.textContent = 'Execute Swap';
            swapFromInput.value = '0';
            calculateSwap();
        }, 1500);
    });


    /* ==========================================================================
       Scroll Reveal Intersection Observer Configuration
       ========================================================================== */
    function initScrollReveal() {
        const revealElements = document.querySelectorAll('.reveal');
        
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target); // Reveal only once
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px' // Trigger slightly before element is centered
        });

        revealElements.forEach(el => {
            observer.observe(el);
        });
    }

    /* ==========================================================================
       Initialize View on load
       ========================================================================== */
    renderMarketTable();
    calculateSwap();
});
