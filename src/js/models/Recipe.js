import axios from 'axios'

export default class Recipe {
    constructor(id) {
        this.id = id;
    }

    async getRecipe() {
        try {
            const res = await axios(`https://forkify-api.herokuapp.com/api/get?rId=${this.id}`)
            this.title = res.data.recipe.title
            this.author = res.data.recipe.publisher
            this.img = res.data.recipe.image_url
            this.url = res.data.recipe.source_url
            this.ingredients = res.data.recipe.ingredients
        } catch(error) {
            console.log(error)
            alert(error);
        }
    }

    calcTime() {

        // 10 minutes for every three ingredients

        const numIng = this.ingredients.length;
        const periods = Math.ceil(numIng/3) 
        this.time = periods*10;
    }

    calcServings() {
        this.servings = 4;
    }

    parseIngredients() {
        const unitsLong = ['tablespoons', 'tablespoon', 'ounces', 'ounce', 'teaspoons', 'teaspoon', 'cups', 'pounds']
        const unitShort = ['tbsp', 'tbsp', 'oz', 'oz', 'tsp', 'tsp', 'cup', 'pound']
        const units = [...unitShort, 'kg', 'g']

        const newIngredients = this.ingredients.map(el => {
            // uniform units 
            let ingredient =  el.toLowerCase()

            unitsLong.forEach((cur, i) => {
                ingredient = ingredient.replace(cur, unitShort[i])
            });

            // remove the parentheses
            ingredient = ingredient.replace(/ *\([^)]*\) */g, ' ')

            // Parse the ingredients into count, unit and the ingredient
            const arrIng = ingredient.split(' ')
            const unitIndex = arrIng.findIndex(el2 => units.includes(el2))


            let objIng;
            if(unitIndex > -1) {
                // there is a unit  
                const arrCount = arrIng.slice(0, unitIndex)

                let count
                if(arrCount.length === 1) {
                    count = eval(arrIng[0].replace('-','+'))
                } else {
                    count = eval(arrIng.slice(0, unitIndex).join('+'))
                }

                objIng = {
                    count,
                    unit: arrIng[unitIndex],
                    ingredient: arrIng.slice(unitIndex+1).join(' ')
                }

            } else if (parseInt(arrIng[0], 10)) {
                // there is no unit but the 1st letter is a number
                objIng = {
                    count: parseInt(arrIng[0], 10),
                    unit: '',
                    ingredient: arrIng.slice(1).join(' ')
                }
            } else if(unitIndex === -1) {
                // there is NO unit and NO number
                objIng = {
                    count: 1,
                    unit: '',
                    ingredient
                }
            }

                return objIng;
        })
        this.ingredients = newIngredients
    }

    updateServings(type) {
        // servings
        const newServings = type=== 'dec' ? this.servings-1 : this.servings+1

        // ingredients
        this.ingredients.forEach(cur => {
            cur.count *= (newServings/this.servings)
        })

        this.servings = newServings
    }

}