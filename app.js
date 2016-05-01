
var app = angular.module("app", [])

.controller("mainCtrl", function($http, $timeout, dbpedia){

  var main = this;

  main.hello = "Hello world!"

  main.focusIn = function(id){
    document.getElementById(id).focus();
  }

  main.search = function(){
    main.results = [];
    if(!main.searchQuery) return;
    main.searching = true;
    if(main.searchTimeout) $timeout.cancel(main.searchTimeout);
    main.searchTimeout = $timeout(function(){
      dbpedia.search(main.searchQuery)
      .then(function(result){

        main.results_temp = result.data.results.bindings;

        for(var i in main.results_temp){
          var add = true;
          for(var j in main.results){
            if(main.results[j].id.value == main.results_temp[i].id.value ){
              add = false;
              break;
            }
          }
          if(add) main.results.push(main.results_temp[i]);
        }

        console.log(main.results);
        main.searching = false;
      })
    }, 500);
  }

  main.goToDocument = function(result){
    var id = result.s.value.split("/");
    id = id[id.length-1];
    var label = result.label.value;
    var type = result.type ? (result.type.value == "http://schema.org/Movie" ? "movie" : "actor") : dbpedia.currentType();
    main.searchQuery = type+":"+id+" #"+label;
    main.search();
  }

})

.factory('dbpedia', function($http, $q){

  var currentType = null;

  var searchPath = function(query){
    //query = query.replace(/ /g, "_");

    return `http://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=%0D%0A%0D%0ASELECT+DISTINCT+%3Fs+%3Flabel++%3Fdescription+%3FbirthDate+%3Fthumbnail+%3Fid+%3Ftype++WHERE+{%0D%0A%0D%0A%0D%0A{%3Fs+rdf%3Atype+schema%3AMovie}+UNION+{%3Fs+rdf%3Atype+umbel-rc%3AActor}.%0D%0A%3Fs+dbp%3Aname+%3Flabel.%0D%0A%3Fs+dbo%3AwikiPageID+%3Fid.%0D%0A%0D%0A%0D%0AOPTIONAL{%3Fs+rdf%3Atype+%3Ftype.%0D%0AFILTER%28%28%3Ftype+%3D+schema%3AMovie%29%2B%28%3Ftype+%3D+umbel-rc%3AActor+%29%29%0D%0A}%0D%0A%0D%0A%0D%0AOPTIONAL+{%0D%0A%3Fs+dbo%3Athumbnail+%3Fthumbnail.%0D%0A}%0D%0A%0D%0A%0D%0AOPTIONAL{%0D%0A%3Fs+dbo%3AbirthYear+%3FbirthDate%0D%0A}%0D%0A%0D%0AOPTIONAL{%0D%0A%3Fs+dbo%3Aabstract+%3Fdescription%0D%0A%0D%0AFILTER+%28lang%28%3Fdescription%29+%3D+%27en%27%29%0D%0A}%0D%0A%0D%0A%0D%0AFILTER+%28lang%28%3Flabel%29+%3D+%27en%27%29%0D%0A%0D%0AFILTER+regex%28%3Flabel%2C%27${query}%27%2C+%27i%27%29.%0D%0A%0D%0A%0D%0A}%0D%0ALIMIT+100%0D%0A&format=JSON&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on`;
  }

  var moviesFromActor = function(id){
    return `http://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=%0D%0A%0D%0ASELECT+DISTINCT+%3Fs+%3Flabel++%3Fdescription+%3FbirthDate+%3Fthumbnail++%3Fid++WHERE+{%0D%0A%0D%0A%0D%0A%3Fs+rdf%3Atype+schema%3AMovie.%0D%0A%0D%0A%3Fs+dbp%3Astarring+%3Factor.%0D%0AFILTER+%28%3Factor+%3D+%3Chttp%3A%2F%2Fdbpedia.org%2Fresource%2F${id}%3E%29%0D%0A%0D%0A%3Fs+dbp%3Aname+%3Flabel.%0D%0A%3Fs+dbo%3AwikiPageID+%3Fid.%0D%0A%0D%0A%0D%0AOPTIONAL+{%0D%0A%3Fs+dbo%3Athumbnail+%3Fthumbnail.%0D%0A}%0D%0A%0D%0A%0D%0AOPTIONAL{%0D%0A%3Fs+dbo%3AbirthYear+%3FbirthDate%0D%0A}%0D%0A%0D%0AOPTIONAL{%0D%0A%3Fs+dbo%3Aabstract+%3Fdescription%0D%0A%0D%0AFILTER+%28lang%28%3Fdescription%29+%3D+%27en%27%29%0D%0A}%0D%0A%0D%0A%0D%0AFILTER+%28lang%28%3Flabel%29+%3D+%27en%27%29%0D%0A%0D%0A%0D%0A}%0D%0A%0D%0AGROUP+BY+%3Fid&format=JSON&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on`;
  }

  var actorsFromMovies = function(link){
    return `http://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=%0D%0A%0D%0ASELECT+DISTINCT+%3Fs+%3Flabel++%3Fdescription+%3FbirthDate+%3Fthumbnail+%3Fid++WHERE+{%0D%0A%0D%0A%3Chttp%3A%2F%2Fdbpedia.org%2Fresource%2F${link}%3E+dbo%3Astarring+%3Fs.%0D%0A%0D%0A%3Fs+dbp%3Aname+%3Flabel.%0D%0A%3Fs+dbo%3AwikiPageID+%3Fid.%0D%0A%0D%0A%0D%0AOPTIONAL+{%0D%0A%3Fs+dbo%3Athumbnail+%3Fthumbnail.%0D%0A}%0D%0A%0D%0A%0D%0AOPTIONAL{%0D%0A%3Fs+dbo%3AbirthYear+%3FbirthDate%0D%0A}%0D%0A%0D%0AOPTIONAL{%0D%0A%3Fs+dbo%3Aabstract+%3Fdescription%0D%0A%0D%0AFILTER+%28lang%28%3Fdescription%29+%3D+%27en%27%29%0D%0A}%0D%0A%0D%0A%0D%0AFILTER+%28lang%28%3Flabel%29+%3D+%27en%27%29%0D%0A%0D%0A%0D%0A}%0D%0A%0D%0AGROUP+BY+%3Fid%0D%0ALIMIT+100&format=JSON&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on`
  }




  var search = function(query){



    if(query.indexOf('#') != -1) query = query.substring(0, query.indexOf('#'));
    query = query.trim();
    query = encodeURI(query);
    var splits = query.split(":");
    if(splits.length > 1 && splits[0] == "movie"){
      currentType = "actor";
      query = query.substring(splits[0].length+1, query.length);
      console.log(currentType);
      return $http.get(actorsFromMovies(query));
    }
    if(splits.length > 1 && splits[0] == "actor"){
      currentType = "movie";
      query = query.substring(splits[0].length+1, query.length);
      console.log(currentType);
      return $http.get(moviesFromActor(query));
    }
    else{
      currentType = null;
      return $http.get(searchPath(query));
    }

  }

  return {
    search: search,
    currentType: () => currentType
  }

})
