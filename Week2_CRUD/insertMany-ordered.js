/* No errors would happen here since we let MongoDB handle the _id property. There could be duplicate data, but the _id would
be unique, so technically there's no errors. */

db.moviesScratch.insertMany([
  {
    imdb: 'tt0084726',
    title: 'Star Trek II: The Wrath of Khan',
    year: 1982,
    type: 'movie'
  },
  {
    imdb: 'tt0796366',
    title: 'Star Trek',
    year: 2009,
    type: 'movie'
  },
  {
    _id: 'tt0084726',
    title: 'Star Trek II: The Wrath of Khan',
    year: 1982,
    type: 'movie'
  },
  {
    imdb: 'tt1408101',
    title: 'Star Trek Into Darkness',
    year: 2013,
    type: 'movie'
  },
  {
    imdb: 'tt0117731',
    title: 'Star Trek: First Contact',
    year: 1996,
    type: 'movie'
  }
]);
