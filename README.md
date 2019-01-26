# vue-inheritance-loader

Webpack loader to be used along with `vue-loader` for **Single File Components** that provides template extension.

In Vue its possible to extend the component's controller using the [extends](https://vuejs.org/v2/api/#extends) option, which merges the data, methods, computed properties, etc. Its also possible to extend a component's template with the use of [slots](https://vuejs.org/v2/guide/components-slots.html). But in some cases where there's the need for tightly coupled components, where we want them to be a single entity but we want to reuse both template and controller logic, `extends` and `slot` aren't enough and can lead to cumbersome code. 

> ### Use this loader with caution, explore Vuer ways to implement what you need before relying on this    

## Installation

Install it onto your project with `npm install`
```
npm install --save-dev vue-inheritance-loader
```

You have to add it to your webpack configuration and it has to execute before `vue-loader`, for example with this config in your `vue.config.js`:
```javascript
module.exports = {
  configureWebpack: {
    module: {
      rules: [
        {
          test: /\.vue$/,
          loader: ['vue-inheritance-loader']
        }
      ]
    }
  }
}
```  

## Usage example

In the following example there's two components, `BaseWidget` and `MapWidget`, where MapWidget extends BaseWidget. 

To make MapWidget's controller extend from BaseWidget's, you have to add `extends: BaseWidget` to the component definition, as you would do in normal Vue.

To make MapWidget's **template** extend from BaseWidget's, the following is needed:
- You have to add `extendable` to BaseWidget's template tag
- You have to add `extends="[path_to_BaseWidget]"` to MapWidget's template tag
- BaseWidget's template may contain `<extension-point>` tags 
- Each `<extension-point>` may have a `name` attribute
- There can be at most **one** default extension point (`<extension-point>` without `name`) in the base component
- MapWidget's template must be comprised by a single `<extensions>` tag, where its children are `<extension>` tags
- Each `<extension>` tag may have a `point` attribute that references which `<extension-point>` it overwrites
- There can be at most **one** default extension (`<extension>` without `point`) in the child component

```vue
// BaseWidget.vue
<template extendable>
    <div>
        <h2>{{title}}</h2>
        <extension-point>This widget has nothing to show</extension-point>
        <div>
            <extension-point name="footer">Default footer</extension-point>
        </div>
    </div>
</template>

<script>
  export default {
    name: 'BaseWidget',
    data: function () {
      return {
        title: 'Empty widget'
      }
    },
  }
</script>
```
```vue
// MapWidget.vue
<template extends="./BaseWidget.vue">
    <extensions>
        <extension>
            <select v-model="country">
                <option v-for="country in countries" :value="country">
                    {{ country }}
                </option>
            </select>
            <br>
            [Here goes the map of {{country}}]
        </extension>
        <extension point="footer">
            Map widget footer
        </extension>
    </extensions>
</template>

<script>
  import BaseWidget from './BaseWidget.vue'

  export default {
    extends: BaseWidget,
    name: 'MapWidget',
    data: function () {
      return {
        country: '',
        countries: [
          'Uruguay',
          'Italy',
          'Argentina',
        ]
      }
    },
    watch: {
      country: function(){
        this.title = 'Map of ' + this.country;
      }
    },
    mounted(){
      this.country = this.countries[0];
    }
  }
</script>
```

This way you can access everything in BaseWidget from MapWidget as if they were the same component (they actually are in the resulting code).


## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.


## License
[ISC](https://choosealicense.com/licenses/isc/)