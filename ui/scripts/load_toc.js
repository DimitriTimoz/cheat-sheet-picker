// access the pre-bundled global API functions
const { invoke } = window.__TAURI__.core

const SHEET = {
    event: new CustomEvent('load_sheets', { detail: 'sheets' })
}

function load_toc(categories) {
    const toc = document.createElement('div')
    for (const category of categories) {
        const categoryElement = document.createElement('div')
        const categoryTitleElement = document.createElement('h2')
        categoryTitleElement.innerHTML = category.title
        categoryElement.appendChild(categoryTitleElement)
        toc.appendChild(categoryElement)
    
        for (const sheet of category.sheets) {
            const sheetElement = document.createElement('a')
            const titleEleement = document.createElement('h3')
            titleEleement.innerHTML = sheet.title

            /*const pdf = document.createElement("embed")
            pdf.setAttribute("src", "sheets/" + sheet.path)
            pdf.setAttribute("width", "1000rem")
            pdf.setAttribute("height", "1000rem")
            sheetElement.appendChild(pdf)
            */
            
            sheetElement.appendChild(titleEleement)
            categoryElement.appendChild(sheetElement)
        }
    }
    const tocContainer = document.getElementById('toc')
    tocContainer.appendChild(toc)
}  

invoke('load_categories', { })
    .then((response) => {
        window.dispatchEvent(new CustomEvent('load_sheets', { detail: {
            sheets: response
        }}));    
    }).catch((error) => {
        console.error(error)
    })
