/**
 * DashCamFinder - Main JavaScript
 * Handles filtering, sorting, and display of dash cam products
 */

// Default product data (used as fallback if JSON file can't be loaded)
let dashCamProducts = [];

// Path to the JSON file containing product data
const PRODUCTS_JSON_PATH = '/data/products.json';

/**
 * Fetches product data from the JSON file
 * @returns {Promise<Array>} - Promise that resolves to the product data array
 */
async function fetchProductData() {
  try {
    const response = await fetch(PRODUCTS_JSON_PATH);
    
    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`Failed to fetch product data: ${response.status} ${response.statusText}`);
    }
    
    // Parse the JSON response
    const data = await response.json();
    
    console.log(`Loaded ${data.length} products from JSON file`);
    return data;
  } catch (error) {
    console.error('Error loading product data:', error);
    
    // If we have products in localStorage, use those as a fallback
    const cachedData = localStorage.getItem('dashCamProducts');
    if (cachedData) {
      try {
        const parsedData = JSON.parse(cachedData);
        console.log(`Using ${parsedData.length} cached products from localStorage`);
        return parsedData;
      } catch (cacheError) {
        console.error('Error parsing cached product data:', cacheError);
      }
    }
    
    // If all else fails, return an empty array
    console.log('Using empty product array as fallback');
    return [];
  }
}

// Load product data when the page loads
window.addEventListener('DOMContentLoaded', async () => {
  // Show loading indicator
  const resultsContainer = document.getElementById('results-container');
  if (resultsContainer) {
    resultsContainer.innerHTML = '<div class="loading">Loading product data...</div>';
  }
  
  try {
    // Fetch product data
    dashCamProducts = await fetchProductData();
    
    // Cache the data in localStorage for offline use
    localStorage.setItem('dashCamProducts', JSON.stringify(dashCamProducts));
    
    // Initialize the page with the loaded data
    initPage();
  } catch (error) {
    console.error('Error initializing page with product data:', error);
    
    // Show error message
    if (resultsContainer) {
      resultsContainer.innerHTML = `
        <div class="error">
          <p>Error loading product data. Please try refreshing the page.</p>
          <p>Error details: ${error.message}</p>
        </div>
      `;
    }
  }
});

// Get unique brands for the filter dropdown
const getBrands = () => {
  const brands = new Set();
  dashCamProducts.forEach(product => brands.add(product.brand));
  return Array.from(brands).sort();
};

// Get unique resolutions for the filter dropdown
const getResolutions = () => {
  const resolutions = new Set();
  dashCamProducts.forEach(product => resolutions.add(product.resolution));
  return Array.from(resolutions).sort();
};

// Filter products based on selected criteria
const filterProducts = (filters) => {
  return dashCamProducts.filter(product => {
    // Filter by brand if selected
    if (filters.brand && product.brand !== filters.brand) {
      return false;
    }
    
    // Filter by model if search text is provided
    if (filters.searchText && !product.model.toLowerCase().includes(filters.searchText.toLowerCase())) {
      return false;
    }
    
    // Filter by resolution if selected
    if (filters.resolution && product.resolution !== filters.resolution) {
      return false;
    }
    
    // Filter by price range if provided
    const price = filters.marketplace === 'amazon_uk' ? product.price.amazon_uk : product.price.amazon_com;
    if (filters.minPrice && price < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice && price > filters.maxPrice) {
      return false;
    }
    
    // Filter by minimum rating if provided
    if (filters.minRating && product.rating < filters.minRating) {
      return false;
    }
    
    return true;
  });
};

// Sort products based on selected criteria
const sortProducts = (products, sortBy, marketplace) => {
  const sortedProducts = [...products];
  
  switch (sortBy) {
    case 'price-low':
      sortedProducts.sort((a, b) => {
        const priceA = marketplace === 'amazon_uk' ? a.price.amazon_uk : a.price.amazon_com;
        const priceB = marketplace === 'amazon_uk' ? b.price.amazon_uk : b.price.amazon_com;
        return priceA - priceB;
      });
      break;
    case 'price-high':
      sortedProducts.sort((a, b) => {
        const priceA = marketplace === 'amazon_uk' ? a.price.amazon_uk : a.price.amazon_com;
        const priceB = marketplace === 'amazon_uk' ? b.price.amazon_uk : b.price.amazon_com;
        return priceB - priceA;
      });
      break;
    case 'rating':
      sortedProducts.sort((a, b) => b.rating - a.rating);
      break;
    case 'newest':
      sortedProducts.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
      break;
    case 'popularity':
      sortedProducts.sort((a, b) => b.popularity - a.popularity);
      break;
    default:
      // Default sort by popularity
      sortedProducts.sort((a, b) => b.popularity - a.popularity);
  }
  
  return sortedProducts;
};

// Format price with currency symbol
const formatPrice = (price, marketplace) => {
  if (!price || price === 0) {
    return 'Price not available';
  }
  
  if (marketplace === 'amazon_uk') {
    return `£${price.toFixed(2)}`;
  }
  return `$${price.toFixed(2)}`;
};

// Generate star rating HTML
const generateStarRating = (rating) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  
  let starsHtml = '';
  
  // Add full stars
  for (let i = 0; i < fullStars; i++) {
    starsHtml += '<i class="fas fa-star"></i>';
  }
  
  // Add half star if needed
  if (halfStar) {
    starsHtml += '<i class="fas fa-star-half-alt"></i>';
  }
  
  // Add empty stars
  for (let i = 0; i < emptyStars; i++) {
    starsHtml += '<i class="far fa-star"></i>';
  }
  
  return starsHtml;
};

// Render products in table view
const renderProductsTable = (products, marketplace) => {
  const resultsContainer = document.getElementById('results-container');
  
  if (products.length === 0) {
    resultsContainer.innerHTML = `
      <div class="no-results">
        <p>No dash cams match your selected filters. Try adjusting your criteria.</p>
      </div>
    `;
    return;
  }
  
  let tableHtml = `
    <table class="results-table">
      <thead>
        <tr>
          <th>Image</th>
          <th>Product</th>
          <th>Price</th>
          <th>Rating</th>
          <th>Features</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  products.forEach(product => {
    const price = marketplace === 'amazon_uk' ? product.price.amazon_uk : product.price.amazon_com;
    const amazonUrl = marketplace === 'amazon_uk' ? product.amazonUrl.uk : product.amazonUrl.com;
    // Default image if none is provided
    const imageUrl = product.image && product.image.trim() !== '' ? 
      product.image : 
      `https://via.placeholder.com/150x100/f0f0f0/333333?text=${encodeURIComponent(product.brand)}`;
    
    tableHtml += `
      <tr>
        <td>
          <img src="${imageUrl}" alt="${product.brand} ${product.model}" class="product-image">
        </td>
        <td>
          <div class="product-title">${product.brand} ${product.model}</div>
          <div class="product-resolution">${product.resolution} Resolution</div>
        </td>
        <td>
          <div class="product-price">${formatPrice(price, marketplace)}</div>
        </td>
        <td>
          <div class="product-rating">
            <div class="stars">${generateStarRating(product.rating)}</div>
            <span>${product.rating} (${product.reviewCount > 0 ? product.reviewCount.toLocaleString() : 'No reviews yet'})</span>
          </div>
        </td>
        <td>
          <div class="product-features">
            <ul>
              ${product.features.slice(0, 3).map(feature => `<li>${feature}</li>`).join('')}
            </ul>
          </div>
        </td>
        <td>
          <a href="${amazonUrl}" target="_blank" class="button buy-button">View on Amazon</a>
        </td>
      </tr>
    `;
  });
  
  tableHtml += `
      </tbody>
    </table>
  `;
  
  resultsContainer.innerHTML = tableHtml;
};

// Render products in grid view
const renderProductsGrid = (products, marketplace) => {
  const resultsContainer = document.getElementById('results-container');
  
  if (products.length === 0) {
    resultsContainer.innerHTML = `
      <div class="no-results">
        <p>No dash cams match your selected filters. Try adjusting your criteria.</p>
      </div>
    `;
    return;
  }
  
  let gridHtml = '<div class="product-grid">';
  
  products.forEach(product => {
    const price = marketplace === 'amazon_uk' ? product.price.amazon_uk : product.price.amazon_com;
    const amazonUrl = marketplace === 'amazon_uk' ? product.amazonUrl.uk : product.amazonUrl.com;
    // Default image if none is provided
    const imageUrl = product.image && product.image.trim() !== '' ? 
      product.image : 
      `https://via.placeholder.com/300x200/f0f0f0/333333?text=${encodeURIComponent(product.brand)}`;
    
    gridHtml += `
      <div class="product-card">
        <div class="product-card-image">
          <img src="${imageUrl}" alt="${product.brand} ${product.model}">
        </div>
        <div class="product-card-content">
          <h3 class="product-card-title">${product.brand} ${product.model}</h3>
          <div class="product-card-price">${formatPrice(price, marketplace)}</div>
          <div class="product-card-rating">
            <div class="stars">${generateStarRating(product.rating)}</div>
            <span>${product.rating} (${product.reviewCount > 0 ? product.reviewCount.toLocaleString() : 'No reviews yet'})</span>
          </div>
          <div class="product-card-features">
            <ul>
              ${product.features.slice(0, 3).map(feature => `<li>${feature}</li>`).join('')}
            </ul>
          </div>
          <div class="product-card-actions">
            <span class="text-muted">${product.resolution}</span>
            <a href="${amazonUrl}" target="_blank" class="button buy-button">View on Amazon</a>
          </div>
        </div>
      </div>
    `;
  });
  
  gridHtml += '</div>';
  
  resultsContainer.innerHTML = gridHtml;
};

// Update results count
const updateResultsCount = (count) => {
  const resultsCount = document.getElementById('results-count');
  resultsCount.textContent = `${count} dash cams found`;
};

// Update URL parameters to make filtered views shareable
const updateUrlParams = (filters, sortBy, viewMode) => {
  const url = new URL(window.location.href);
  
  // Clear existing parameters
  url.search = '';
  
  // Add filter parameters
  if (filters.marketplace) url.searchParams.set('marketplace', filters.marketplace);
  if (filters.brand) url.searchParams.set('brand', filters.brand);
  if (filters.searchText) url.searchParams.set('search', filters.searchText);
  if (filters.resolution) url.searchParams.set('resolution', filters.resolution);
  if (filters.minPrice) url.searchParams.set('minPrice', filters.minPrice);
  if (filters.maxPrice) url.searchParams.set('maxPrice', filters.maxPrice);
  if (filters.minRating) url.searchParams.set('minRating', filters.minRating);
  
  // Add sort and view parameters
  if (sortBy) url.searchParams.set('sort', sortBy);
  if (viewMode) url.searchParams.set('view', viewMode);
  
  // Update URL without reloading the page
  window.history.pushState({}, '', url);
  
  // Update page title for SEO
  let title = 'DashCamFinder - Compare Dash Cam Prices and Features';
  
  if (filters.brand) {
    title = `${filters.brand} Dash Cams - Compare Prices and Features | DashCamFinder`;
  }
  
  if (filters.resolution) {
    title = `${filters.resolution} Dash Cams - High Resolution Comparison | DashCamFinder`;
  }
  
  if (filters.brand && filters.resolution) {
    title = `${filters.brand} ${filters.resolution} Dash Cams | DashCamFinder`;
  }
  
  document.title = title;
  
  // Update meta description for SEO
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    let description = 'Compare dash cam prices and features across top brands. Find the perfect dash cam for your vehicle.';
    
    if (filters.brand) {
      description = `Compare ${filters.brand} dash cam prices and features. Find the best ${filters.brand} dash cam for your vehicle.`;
    }
    
    if (filters.resolution) {
      description = `Compare ${filters.resolution} dash cam prices and features. High resolution dash cams for crystal clear footage.`;
    }
    
    if (filters.brand && filters.resolution) {
      description = `Compare ${filters.brand} ${filters.resolution} dash cam prices and features. Find the best high-resolution dash cam for your needs.`;
    }
    
    metaDescription.setAttribute('content', description);
  }
};

// Get URL parameters when page loads
const getUrlParams = () => {
  const urlParams = new URLSearchParams(window.location.search);
  
  return {
    marketplace: urlParams.get('marketplace') || 'amazon_com',
    brand: urlParams.get('brand') || '',
    searchText: urlParams.get('search') || '',
    resolution: urlParams.get('resolution') || '',
    minPrice: urlParams.get('minPrice') ? parseFloat(urlParams.get('minPrice')) : '',
    maxPrice: urlParams.get('maxPrice') ? parseFloat(urlParams.get('maxPrice')) : '',
    minRating: urlParams.get('minRating') ? parseFloat(urlParams.get('minRating')) : '',
    sortBy: urlParams.get('sort') || 'popularity',
    viewMode: urlParams.get('view') || 'table'
  };
};

// Initialize the page with product data
const initPage = () => {
  // If no products were loaded, show an error message
  if (!dashCamProducts || dashCamProducts.length === 0) {
    const resultsContainer = document.getElementById('results-container');
    if (resultsContainer) {
      resultsContainer.innerHTML = `
        <div class="no-results">
          <p>No product data available. Please check your connection and try again.</p>
        </div>
      `;
    }
    return;
  }
  // Get elements
  const marketplaceRadios = document.querySelectorAll('input[name="marketplace"]');
  const brandSelect = document.getElementById('brand-select');
  const searchInput = document.getElementById('search-input');
  const resolutionSelect = document.getElementById('resolution-select');
  const minPriceInput = document.getElementById('min-price');
  const maxPriceInput = document.getElementById('max-price');
  const minRatingSelect = document.getElementById('min-rating');
  const sortSelect = document.getElementById('sort-select');
  const viewModeButtons = document.querySelectorAll('.view-mode-button');
  const resetFiltersButton = document.getElementById('reset-filters');
  
  // Get URL parameters
  const params = getUrlParams();
  
  // Set initial form values from URL parameters
  document.querySelector(`input[name="marketplace"][value="${params.marketplace}"]`).checked = true;
  
  // Populate brand dropdown
  const brands = getBrands();
  let brandOptionsHtml = '<option value="">All Brands</option>';
  brands.forEach(brand => {
    brandOptionsHtml += `<option value="${brand}" ${params.brand === brand ? 'selected' : ''}>${brand}</option>`;
  });
  brandSelect.innerHTML = brandOptionsHtml;
  
  // Populate resolution dropdown
  const resolutions = getResolutions();
  let resolutionOptionsHtml = '<option value="">All Resolutions</option>';
  resolutions.forEach(resolution => {
    resolutionOptionsHtml += `<option value="${resolution}" ${params.resolution === resolution ? 'selected' : ''}>${resolution}</option>`;
  });
  resolutionSelect.innerHTML = resolutionOptionsHtml;
  
  // Set other form values
  searchInput.value = params.searchText;
  minPriceInput.value = params.minPrice;
  maxPriceInput.value = params.maxPrice;
  minRatingSelect.value = params.minRating;
  sortSelect.value = params.sortBy;
  
  // Set active view mode
  viewModeButtons.forEach(button => {
    if (button.dataset.view === params.viewMode) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
  
  // Apply initial filters and render products
  applyFilters();
  
  // Add event listeners
  marketplaceRadios.forEach(radio => {
    radio.addEventListener('change', applyFilters);
  });
  
  brandSelect.addEventListener('change', applyFilters);
  searchInput.addEventListener('input', debounce(applyFilters, 300));
  resolutionSelect.addEventListener('change', applyFilters);
  minPriceInput.addEventListener('input', debounce(applyFilters, 300));
  maxPriceInput.addEventListener('input', debounce(applyFilters, 300));
  minRatingSelect.addEventListener('change', applyFilters);
  sortSelect.addEventListener('change', applyFilters);
  
  viewModeButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Remove active class from all buttons
      viewModeButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      button.classList.add('active');
      
      // Apply filters with new view mode
      applyFilters();
    });
  });
  
  resetFiltersButton.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Reset form values
    document.querySelector('input[name="marketplace"][value="amazon_com"]').checked = true;
    brandSelect.value = '';
    searchInput.value = '';
    resolutionSelect.value = '';
    minPriceInput.value = '';
    maxPriceInput.value = '';
    minRatingSelect.value = '';
    sortSelect.value = 'popularity';
    
    // Apply filters
    applyFilters();
  });
};

// Apply filters and render products
const applyFilters = () => {
  // Get filter values
  const marketplace = document.querySelector('input[name="marketplace"]:checked').value;
  const brand = document.getElementById('brand-select').value;
  const searchText = document.getElementById('search-input').value;
  const resolution = document.getElementById('resolution-select').value;
  const minPrice = document.getElementById('min-price').value ? parseFloat(document.getElementById('min-price').value) : '';
  const maxPrice = document.getElementById('max-price').value ? parseFloat(document.getElementById('max-price').value) : '';
  const minRating = document.getElementById('min-rating').value ? parseFloat(document.getElementById('min-rating').value) : '';
  const sortBy = document.getElementById('sort-select').value;
  
  // Get active view mode
  const viewMode = document.querySelector('.view-mode-button.active').dataset.view;
  
  // Create filters object
  const filters = {
    marketplace,
    brand,
    searchText,
    resolution,
    minPrice,
    maxPrice,
    minRating
  };
  
  // Filter and sort products
  const filteredProducts = filterProducts(filters);
  const sortedProducts = sortProducts(filteredProducts, sortBy, marketplace);
  
  // Update results count
  updateResultsCount(sortedProducts.length);
  
  // Render products based on view mode
  if (viewMode === 'table') {
    renderProductsTable(sortedProducts, marketplace);
  } else {
    renderProductsGrid(sortedProducts, marketplace);
  }
  
  // Update URL parameters
  updateUrlParams(filters, sortBy, viewMode);
};

// Debounce function to limit how often a function can be called
const debounce = (func, delay) => {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

// Note: The DOMContentLoaded event listener is now handled in the window.addEventListener above
