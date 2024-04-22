let SHEETS = [];

let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

function autocomplete(inp, arr) {
    let currentFocus;

    inp.addEventListener("input", function(e) {
        let val = this.value;
        let vals = val.split(' ');
        closeAllLists();
        currentFocus = -1;

        let listContainer = document.createElement("div");
        listContainer.setAttribute("id", this.id + "autocomplete-list");
        listContainer.setAttribute("class", "autocomplete-items");
        this.parentNode.appendChild(listContainer);

        // Sort array to show favorites first
        arr.sort((a, b) => (favorites.includes(b[1]) - favorites.includes(a[1])));
        
        let matched_words = {};
        for (let i = 0; i < arr.length; i++) {
            let matches = [];
            for (let j = 0; j < vals.length; j++) {
                if (vals[j] === "") continue;
                let index = arr[i][0].toUpperCase().indexOf(vals[j].toUpperCase());
                if (index !== -1) {
                    // Check if the word is already matched
                    let already_matched = false;
                    for (let k = 0; k < matches.length; k++) {
                        if (index >= matches[k][0] && index < matches[k][0] + matches[k][1]) {
                            already_matched = true;
                            break;
                        }
                    }
                    if (!already_matched)
                        matches.push([index, vals[j].length]);
                }
            }
            matched_words[arr[i][1]] = matches
        }

        arr.sort((a, b) => (matched_words[b[1]].length - matched_words[a[1]].length));
        for (let i = 0; i < arr.length; i++) {
            if (matched_words[arr[i][1]].length > 0) {
                // Sort the matched words by index
                let matches = matched_words[arr[i][1]];
                matches.sort((a, b) => a[0] - b[0]);
                // Put bold tags around the matched words
                let name = arr[i][0];
                let new_str = "";
                let last_index = 0; 
                
                for (let j = 0; j < matches.length; j++) {
                    // Add text before the current match
                    new_str += name.substring(last_index, matches[j][0]);
                    // Add the bolded text
                    new_str += "<strong>" + name.substring(matches[j][0], matches[j][0] + matches[j][1]) + "</strong>";
                    // Update last_index to end of the current match
                    last_index = matches[j][0] + matches[j][1];
                }
                new_str += name.substring(last_index);
                let content = document.createElement("div");
                content.innerHTML = new_str;
            
                let item = document.createElement("div");
                let hiddenInput = document.createElement('input');
                hiddenInput.type = 'hidden';
                hiddenInput.setAttribute('path', arr[i][1]);
                hiddenInput.value = arr[i][0];
                item.appendChild(content);
                item.appendChild(hiddenInput);
                item.appendChild(content);
                item.appendChild(hiddenInput);
                
                // Check if the item is a favorite and create a star symbol
                let star = document.createElement('span');
                star.className = 'star';
                star.innerHTML = favorites.includes(arr[i][1]) ? '★' : '☆';
                item.appendChild(star);


                item.addEventListener("click", function(e) {
                    let this_inp = this.getElementsByTagName("input")[0];
                    // Check if the user clicked on the star
                    if (e.target.className === "star") {
                        let parent = e.target.parentNode;
                        const path = parent.getElementsByTagName("input")[0].getAttribute("path");
                        toggleFavorite(path);
                        let isFavorite = favorites.includes(path);
                        e.target.innerHTML = isFavorite ? '★' : '☆';
                        return;
                    }
                    inp.value = this_inp.value;
                    inp.path = this_inp.getAttribute("path");

                    closeAllLists();
                    updatePath(inp.path);
                    
                });
                listContainer.appendChild(item);
            }
        }
    });

    function toggleFavorite(path) {
        let index = favorites.indexOf(path);
        if (index > -1) {
            favorites.splice(index, 1);
        } else {
            favorites.push(path); 
        }
        localStorage.setItem('favorites', JSON.stringify(favorites)); 
    }

    inp.addEventListener("keydown", function(e) {
        let x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode === 40) {  // Down arrow
            currentFocus++;
            addActive(x);
        } else if (e.keyCode === 38) { // Up arrow
            currentFocus--;
            addActive(x);
        } else if (e.keyCode === 13) {  // Enter
            e.preventDefault();
            if (currentFocus > -1 && x) {
                x[currentFocus].click();
            }
        }
    });

    function addActive(x) {
        if (!x) return false;
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = x.length - 1;
        x[currentFocus].classList.add("autocomplete-active");
    }

    function removeActive(x) {
        for (let i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }

    function closeAllLists(elmnt) {
        let x = document.getElementsByClassName("autocomplete-items");
        for (let i = 0; i < x.length; i++) {
            if (elmnt !== x[i] && elmnt !== inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }

    document.addEventListener("click", function (e) {
        // Check if the click was on a star
        if (e.target.className === "star") return;

        closeAllLists(e.target);
    });
}

let viewer = null;
function updatePath(query) {
    // Get current path
    let currentPath = localStorage.getItem('lastPath');
    if (currentPath == query) return;
    
    let newSrc = "/sheets/" + query;
    let oldPath = document.getElementById("viewer");


    if (query.endsWith(".pdf")) {
        document.getElementById("imageContainer").style.display = "none";
        let newPath = document.createElement("iframe");
        newPath.setAttribute("id", "viewer");
        newPath.setAttribute("src", newSrc);
      
        oldPath.parentNode.replaceChild(newPath, oldPath);
    } else {
        viewer = new Viewer(document.getElementById('imageViewer'), {
            inline: true,
            viewed() {
                viewer.zoomTo(2);
            },
        });
        viewer.show();
        oldPath.style.display = "none";
        document.getElementById("imageContainer").style.display = "flex";
        document.getElementById("imageViewer").src = newSrc;
    }
    // Save the current path
    localStorage.setItem('lastPath', query);
}
    
window.addEventListener('load_sheets', function(sheets) {
    SHEETS = sheets.detail.sheets.map(category => category.sheets.map(sheet => [sheet.title, sheet.path])).flat();
    autocomplete(document.getElementById("query-input"), SHEETS);
    let lastPath = localStorage.getItem('lastPath');
    if (lastPath) {
        updatePath(lastPath);
    }
});
