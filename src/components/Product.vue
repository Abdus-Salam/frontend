<template>
  <div>
    <v-snackbar
      v-model="snackbar"
      :color="color"
      :multi-line="mode === 'multi-line'"
      :timeout="timeout"
      :top="true"
      :vertical="mode === 'vertical'"
    >
      {{ snackbarText }}
      <v-btn text @click="snackbar = false" style="color:white;">Close</v-btn>
    </v-snackbar>
    <v-data-table
      :headers="headers"
      :items="itemsWithSno"
      :server-items-length="totalItems"
      :options.sync="pagination"
      :loading="loading"
      class="elevation-4"
      :footer-props="{
        itemsPerPageOptions: [10, 20, 30, 50, 100, -1],
      }"
      :items-per-page="10"
      @page-count="pageCount = $event"
      hide-default-footer
    >
      <template #item.image="{ item }">
        <v-list-item-avatar color="grey" size="60px" v-if="item.image != null">
          <img
            :src="'http://127.0.0.1:8000/storage/productImage/' + item.image"
            alt="Product Image"
          />
        </v-list-item-avatar>

        <v-list-item-avatar color="grey" size="60px" v-if="item.image == null">
          <img
            src="http://127.0.0.1:8000/storage/productImage/no_image_available.png"
            alt="Product Image"
          />
        </v-list-item-avatar>
      </template>
      <template v-slot:[`item.status_to_string`]="{ item }">
        <v-chip color="green" text-color="white" v-if="item.status == 1">
          {{ item.status_to_string }}
        </v-chip>
        <v-chip color="red" text-color="white" v-if="item.status == 0">
          {{ item.status_to_string }}
        </v-chip>
      </template>

      <template v-slot:[`item.fulluser`]="{ item }">
        <span>{{ item.user_type }} ({{ item.user_name }}) </span>
      </template>

      <!-- table top header -->
      <template v-slot:top>
        <v-toolbar flat color="white">
          <v-card color="red" class="elevation-6 pa-2 mr-4 mb-10 ml-0">
            <v-icon dark style="font-size: 48px">mdi-blur</v-icon>
          </v-card>
          <h4 class="siteDataTableHeading">All Products</h4>
          <v-spacer></v-spacer>
          <v-btn class="mx-2" fab dark color="siteColor" @click="dialog = true">
            <v-icon dark>mdi-plus</v-icon>
          </v-btn>
          <!-- dialog -->
          <v-dialog v-model="dialog" max-width="300px">
            <v-card>
              <v-card-title class="headline grey lighten-2 mb-2" primary-title
                >Add Product</v-card-title
              >
              <v-card-text>
                <v-form ref="form">
                  <v-text-field
                    v-model="editedItem.title"
                    :rules="[v => !!v || 'Title field is required']"
                    label="Enter title *"
                    required
                    outlined
                    dense
                    autocomplete="off"
                  ></v-text-field>
                  <v-text-field
                    v-model="editedItem.description"
                    label="Enter description"
                    outlined
                    dense
                    autocomplete="off"
                  ></v-text-field>

                  <v-text-field
                    v-model="editedItem.price"
                    :rules="[v => !!v || 'Title field is required']"
                    required
                    label="Enter price*"
                    type="number"
                    outlined
                    dense
                    autocomplete="off"
                  ></v-text-field>

                  <v-file-input
                    label="Select photo"
                    append-icon="mdi-camera"
                    accept="image/x-png, image/jpg, image/jpeg"
                    :rules="[
                      files =>
                        !files ||
                        files.size < 2097152 ||
                        'Photo size should be less than 2 MB!',
                    ]"
                    show-size
                    outlined
                    dense
                    @change="onFileSelected"
                  ></v-file-input>
                </v-form>
              </v-card-text>
              <v-divider></v-divider>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="error" class="my-2" @click="close">Close</v-btn>
                <v-btn color="primary" class="my-2" @click="save">Save</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
          <!-- ./dialog -->
        </v-toolbar>
      </template>
      <!-- ./ table top header -->
      <!-- actions -->
      <template v-slot:item.actions="{ item }">
        <v-icon class="mr-2" @click="editItem(item)" color="warning"
          >mdi-pencil</v-icon
        >
        <v-icon @click="deleteItem(item)" color="error">mdi-delete</v-icon>
      </template>

      <!-- ./ actions -->
    </v-data-table>
  </div>
</template>

<style scoped>
.v-pagination__item {
  display: none;
}
.v-pagination__more {
  display: none;
}
</style>
<script>
import axios from "axios";
import { mapGetters } from "vuex";
export default {
  data() {
    return {
      endpoints: "/products/",
      snackbar: false,
      color: "#ff0000",
      mode: "",
      timeout: 5000,
      snackbarText: "Unauthorized",
      dialog: false,
      loading: true,
      totalItems: 0,
      pageCount: 0,
      items: [],
      pagination: {}, // options for combined object for pagination
      headers: [
        { text: "#sn", value: "sno" },
        { text: "Image", value: "image" },
        { text: "Title", value: "title" },
        { text: "Description", value: "description" },
        { text: "Price", value: "price" },
        { text: "Actions", value: "actions", sortable: false },
      ],

      previewImages: "",

      editedIndex: -1,
      editedItem: {
        id: "",
        title: "",
        description: "",
        price: "",
        image: "",
        user_id: "",
      },
      defaultItem: {
        id: "",
        title: "",
        description: "",
        price: "",
        image: "",
        user_id: "",
      },
    };
  },

  computed: {
    itemsWithSno() {
      return this.items.map((d, index) => ({ ...d, sno: index + 1 }));
    },
    ...mapGetters({
      authenticated: "Auth/authenticated",
      user: "Auth/user",
    }),
  },

  watch: {
    pagination: {
      handler() {
        this.getDataFromApi().then(response => {
          this.items = response.items;
          this.totalItems = response.total;
        });
      },
      deep: true,
    },
  },

  methods: {
    onFileSelected(event) {
      this.previewImages = "";
      const reader = new FileReader();
      reader.onload = e => {
        this.previewImages = e.target.result;
      };

      reader.readAsDataURL(event);
      this.editedItem.image = event;
    },

    close() {
      this.dialog = false;
      this.$refs.form.reset();
      this.editedItem = Object.assign({}, this.defaultItem);
      this.editedIndex = -1;
      this.getDataFromApi().then(response => {
        this.items = response.items;
        this.totalItems = response.total;
      });
    },
    save() {
      const isValid = this.$refs.form.validate();
      if (isValid) {
        const formData = new FormData();
        formData.append("_method", "post");
        formData.append("id", this.editedItem.id);
        formData.append("title", this.editedItem.title);
        formData.append("description", this.editedItem.description);
        formData.append("price", this.editedItem.price);
        formData.append("user_id", this.user.id);
        formData.append("image", this.editedItem.image);

        if (this.editedIndex > -1) {
          axios
            .post("/productUpdate", formData)
            .then(response => {
              this.color = "green";
              this.snackbarText = "Product updated successfully!";
              this.snackbar = true;
            })
            .catch(() => {
              //console.log(err);
            })
            .then(() => {
              this.close();
            });
        } else {
          axios
            .post(this.endpoints, formData, {
              useCredentails: true,
            })
            .then(() => {
              this.color = "green";
              this.snackbarText = "Product added successfully!";
              this.snackbar = true;
            })
            .catch(() => {
              //console.log(err);
            })
            .then(() => {
              this.close();
            });
        }
      }
    },
    editItem(item) {
      this.editedIndex = item.id;
      this.editedItem = Object.assign(
        {},
        {
          id: item.id,
          title: item.title,
          description: item.description,
          price: item.price,
          image: item.image,
          user_id: item.user_id,
        }
      );
      this.dialog = true;
    },

    deleteItem(item) {
      if (confirm("Are you sure want to delete this item from server?")) {
        axios
          .delete(this.endpoints + item.id)
          .then(() => {
            this.color = "green";
            this.snackbarText = "Product deleted successfully!";
            this.snackbar = true;
          })
          .catch(() => {
            // console.log(error);
          })
          .then(() => {
            //reinitialize the table
            this.getDataFromApi().then(response => {
              this.items = response.items;
              this.totalItems = response.total;
            });
          });
      }
    },
    getDataFromApi() {
      this.loading = true;
      return new Promise(resolve => {
        const { sortBy, descending } = this.pagination;

        let items;
        let total;
        axios.get(this.endpoints).then(response => {
          // Authorization token is sends by axois headers
          items = response.data.data;
          total = response.data.totalRecords;

          if (this.pagination.sortBy) {
            items = items.sort((a, b) => {
              const sortA = a[sortBy];
              const sortB = b[sortBy];

              if (descending) {
                if (sortA < sortB) {
                  return 1;
                } else {
                  if (sortA > sortB) {
                    return -1;
                  }
                }

                return 0;
              } else {
                if (sortA < sortB) {
                  return -1;
                } else {
                  if (sortA > sortB) {
                    return 1;
                  }
                }
                return 0;
              }
            });
          } // sort by pagination

          // if (itemsPerPage > 0) {
          //   items = items.slice((page - 1) * itemsPerPage, page * itemsPerPage);
          // }

          this.loading = false;
          resolve({
            items,
            total,
          });
        });
      });
    },
  },
};
</script>
