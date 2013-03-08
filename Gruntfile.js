module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    vows: {
        all: {
          options: {
            reporter: "spec",
            verbose: false,
            silent: false,
            colors: true,
            isolate: false,
            coverage: "json"
          },
          src: ["test/*.js"]
        }
    }
  });

  grunt.loadNpmTasks("grunt-vows");

  grunt.registerTask('default', ['vows']);
};
