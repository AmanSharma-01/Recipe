import Search from './models/Search'
import Recipe from './models/Recipe'
import List from './models/List'
import Likes from './models/Likes'
import * as searchView from './views/searchView'
import * as recipeView from './views/recipeView'
import * as listView from './views/listView'
import * as likesView from './views/likesView'
import{elements, renderLoader, clearLoader} from './views/base'


/* global state of the app
- Search object
- Current Recipe object
- Shopping list object
- Liked recipes
*/

const state = {};

// **************************** SEARCH CONTROLLER **************************************//
const controlSearch = async () => {
    // 1. get the query from view
    const query = searchView.getInput();

    if(query) {
            // 2.new search object and add it to state
            state.search = new Search(query)    

            // 3. prepare the UI
            searchView.clearInput();
            searchView.clearResults();
            renderLoader(elements.searchRes);

            try{
                // 4. Search for the recipe
                await state.search.getResults();

                // 5. Render result on UI
                clearLoader();
                searchView.renderResults(state.search.result);
            } catch(err) {
                console.log(err)
                alert(err)
                clearLoader();
            }
            
        }
}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch()
})



elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline')
    if(btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);

    }
})

// **************************** RECIPE CONTROLLER **************************************//

const controlRecipe = async () => {
    // get the id from the URL
    const id = window.location.hash.replace('#', '')

    if (id) {
        // Prepare the UI for the changes 
        recipeView.clearRecipe()
        renderLoader(elements.recipe)

        // highlight selected recipe
        if(state.search) searchView.highlightSelected(id)

        // Create the new recipr object
        state.recipe = new Recipe(id);
        try {

             // get recipe data and parse the ingredient
            await state.recipe.getRecipe()
            state.recipe.parseIngredients()

            // calculate the serving and time 
            state.recipe.calcTime()
            state.recipe.calcServings()

            // render the recipe
            clearLoader();
            recipeView.renderRecipe(state.recipe, state.likes.isLiked(id))
        } catch(error) {
            console.log(error)
            alert(error)
        }
       
    }
    
}
['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

// **************************** SHOPPING LIST CONTROLLER **************************************//

const controlList = () => {
    // Create a new list IF there in none yet
    if (!state.list) state.list = new List();

    // Add each ingredient to the list and UI
    state.recipe.ingredients.forEach(el => {
            const item = state.list.addItem(el.count, el.unit, el.ingredient);
            listView.renderItem(item);
    });
}

// Handle delete and update list item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid

    // handle the delete button
    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        // delete from the state 
        state.list.deleteItem(id)

        // delete from the UI
        listView.deleteItem(id)
    } else if(e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10)
        if (val > 0) {
            state.list.updateCount(id, val)
        }
        
    }
})

// **************************** LIKE CONTROLLER **************************************//
const controlLike = () => {
    if(!state.likes) state.likes = new Likes()
    const currentID = state.recipe.id

    // the recipe is not liked yet by the user
    if(!state.likes.isLiked(currentID)) {
        // add the recipe to the state
            const newLike = state.likes.addLike(
                currentID,
                state.recipe.title,
                state.recipe.author,
                state.recipe.img
            )
        // Toggle the like button
        likesView.toggleLikeBtn(true)
        // add the recipe to the like list in the UI
        likesView.renderLike(newLike);
    } else {
    // the recipe is already liked by the user
        // remove the recipe from the state
        state.likes.deleteLike(currentID)
        // Toggle the like button
        likesView.toggleLikeBtn(false)
        // remove the recipe from the like list in the UI
        likesView.deleteLike(currentID)
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes())
}

// Restore liked recipes when the page reloads

window.addEventListener('load', () => {
    state.likes = new Likes()
    // restore the likes
    state.likes.readStorage()

    // toggle the like btn according to the length of the liked recipes
    likesView.toggleLikeMenu(state.likes.getNumLikes())

    // render the existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));

})


// Handle the recipe button
elements.recipe.addEventListener('click', e => {
    if(e.target.matches('.btn-decrease, .btn-decrease *')) {
        // dec btn is clicked 
        if(state.recipe.servings > 1) {
            state.recipe.updateServings('dec')
            recipeView.updateServingsIngredients(state.recipe)
        }
        
    } else if(e.target.matches('.btn-increase, .btn-increase *')) {
        // inc btn is clicked 
        state.recipe.updateServings('inc')
        recipeView.updateServingsIngredients(state.recipe)
    } else if(e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        // add the ingredients to the shopping list
        controlList();
    } else if(e.target.matches('.recipe__love, .recipe__love *')) {
        // call the like controller
        controlLike()
    }
})