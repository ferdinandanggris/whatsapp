namespace WaDesktop.Client.Views.ManagementViews
{
    partial class PhoneNumberDetailView
    {
        private System.ComponentModel.IContainer components = null;
        private System.Windows.Forms.PictureBox picProfile;
        private System.Windows.Forms.Button btnUploadPhoto;
        private System.Windows.Forms.Button btnFetchMeta;
        private System.Windows.Forms.Label lblPhoneId;
        private System.Windows.Forms.Label lblQuality;
        private System.Windows.Forms.TextBox txtDisplayName;
        private System.Windows.Forms.TextBox txtDescription;
        private System.Windows.Forms.ComboBox cboCompany;
        private System.Windows.Forms.Button btnSave;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.Label label3;
        private System.Windows.Forms.Label label4;
        private System.Windows.Forms.Label label5;
        private System.Windows.Forms.TextBox txtPhoneId;
        private System.Windows.Forms.TextBox txtQuality;

        // new fields
        private System.Windows.Forms.Label lblEmail;
        private System.Windows.Forms.TextBox txtEmail;
        private System.Windows.Forms.Label lblAbout;
        private System.Windows.Forms.TextBox txtAbout;
        private System.Windows.Forms.Label lblAddress;
        private System.Windows.Forms.TextBox txtAddress;
        private System.Windows.Forms.Label lblVertical;
        private System.Windows.Forms.ComboBox cboVertical;
        private System.Windows.Forms.Label lblWebsites;
        private System.Windows.Forms.TextBox txtWebsites;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
                components.Dispose();
            base.Dispose(disposing);
        }

        private void InitializeComponent()
        {
            this.picProfile = new System.Windows.Forms.PictureBox();
            this.btnUploadPhoto = new System.Windows.Forms.Button();
            this.btnFetchMeta = new System.Windows.Forms.Button();
            this.lblPhoneId = new System.Windows.Forms.Label();
            this.lblQuality = new System.Windows.Forms.Label();
            this.txtDisplayName = new System.Windows.Forms.TextBox();
            this.txtDescription = new System.Windows.Forms.TextBox();
            this.cboCompany = new System.Windows.Forms.ComboBox();
            this.btnSave = new System.Windows.Forms.Button();
            this.label1 = new System.Windows.Forms.Label();
            this.label2 = new System.Windows.Forms.Label();
            this.label3 = new System.Windows.Forms.Label();
            this.label4 = new System.Windows.Forms.Label();
            this.label5 = new System.Windows.Forms.Label();
            this.txtPhoneId = new System.Windows.Forms.TextBox();
            this.txtQuality = new System.Windows.Forms.TextBox();
            this.lblEmail = new System.Windows.Forms.Label();
            this.txtEmail = new System.Windows.Forms.TextBox();
            this.lblAbout = new System.Windows.Forms.Label();
            this.txtAbout = new System.Windows.Forms.TextBox();
            this.lblAddress = new System.Windows.Forms.Label();
            this.txtAddress = new System.Windows.Forms.TextBox();
            this.lblVertical = new System.Windows.Forms.Label();
            this.cboVertical = new System.Windows.Forms.ComboBox();
            this.lblWebsites = new System.Windows.Forms.Label();
            this.txtWebsites = new System.Windows.Forms.TextBox();
            ((System.ComponentModel.ISupportInitialize)(this.picProfile)).BeginInit();
            this.SuspendLayout();

            // picProfile
            this.picProfile.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.picProfile.Location = new System.Drawing.Point(20, 20);
            this.picProfile.Name = "picProfile";
            this.picProfile.Size = new System.Drawing.Size(120, 120);
            this.picProfile.SizeMode = System.Windows.Forms.PictureBoxSizeMode.Zoom;
            this.picProfile.TabIndex = 0;
            this.picProfile.TabStop = false;

            // btnUploadPhoto
            this.btnUploadPhoto.Location = new System.Drawing.Point(20, 150);
            this.btnUploadPhoto.Name = "btnUploadPhoto";
            this.btnUploadPhoto.Size = new System.Drawing.Size(120, 28);
            this.btnUploadPhoto.TabIndex = 1;
            this.btnUploadPhoto.Text = "Upload Photo";
            this.btnUploadPhoto.UseVisualStyleBackColor = true;
            this.btnUploadPhoto.Click += new System.EventHandler(this.BtnUploadPhoto_Click);

            // btnFetchMeta
            this.btnFetchMeta.Location = new System.Drawing.Point(20, 184);
            this.btnFetchMeta.Name = "btnFetchMeta";
            this.btnFetchMeta.Size = new System.Drawing.Size(120, 28);
            this.btnFetchMeta.TabIndex = 2;
            this.btnFetchMeta.Text = "Fetch from Meta";
            this.btnFetchMeta.UseVisualStyleBackColor = true;
            this.btnFetchMeta.Click += new System.EventHandler(this.BtnFetchMeta_Click);

            // label1
            this.label1.AutoSize = true;
            this.label1.Location = new System.Drawing.Point(160, 24);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(88, 13);
            this.label1.TabIndex = 3;
            this.label1.Text = "Phone Number ID";

            // txtPhoneId
            this.txtPhoneId.Location = new System.Drawing.Point(160, 40);
            this.txtPhoneId.Name = "txtPhoneId";
            this.txtPhoneId.ReadOnly = true;
            this.txtPhoneId.Size = new System.Drawing.Size(260, 22);
            this.txtPhoneId.TabIndex = 4;

            // label2
            this.label2.AutoSize = true;
            this.label2.Location = new System.Drawing.Point(160, 68);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(72, 13);
            this.label2.TabIndex = 5;
            this.label2.Text = "Display Name";

            // txtDisplayName
            this.txtDisplayName.Location = new System.Drawing.Point(160, 84);
            this.txtDisplayName.Name = "txtDisplayName";
            this.txtDisplayName.Size = new System.Drawing.Size(260, 22);
            this.txtDisplayName.TabIndex = 6;

            // label3
            this.label3.AutoSize = true;
            this.label3.Location = new System.Drawing.Point(160, 112);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(62, 13);
            this.label3.TabIndex = 7;
            this.label3.Text = "Description";

            // txtDescription
            this.txtDescription.Location = new System.Drawing.Point(160, 128);
            this.txtDescription.Multiline = true;
            this.txtDescription.Name = "txtDescription";
            this.txtDescription.Size = new System.Drawing.Size(260, 56);
            this.txtDescription.TabIndex = 8;

            // label4
            this.label4.AutoSize = true;
            this.label4.Location = new System.Drawing.Point(160, 198);
            this.label4.Name = "label4";
            this.label4.Size = new System.Drawing.Size(54, 13);
            this.label4.TabIndex = 9;
            this.label4.Text = "Company";

            // cboCompany
            this.cboCompany.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cboCompany.Location = new System.Drawing.Point(160, 214);
            this.cboCompany.Name = "cboCompany";
            this.cboCompany.Size = new System.Drawing.Size(260, 21);
            this.cboCompany.TabIndex = 10;

            // label5
            this.label5.AutoSize = true;
            this.label5.Location = new System.Drawing.Point(160, 252);
            this.label5.Name = "label5";
            this.label5.Size = new System.Drawing.Size(73, 13);
            this.label5.TabIndex = 11;
            this.label5.Text = "Quality Rating";

            // txtQuality
            this.txtQuality.Location = new System.Drawing.Point(160, 268);
            this.txtQuality.Name = "txtQuality";
            this.txtQuality.ReadOnly = true;
            this.txtQuality.Size = new System.Drawing.Size(260, 22);
            this.txtQuality.TabIndex = 12;

            // lblEmail
            this.lblEmail.AutoSize = true;
            this.lblEmail.Location = new System.Drawing.Point(160, 306);
            this.lblEmail.Name = "lblEmail";
            this.lblEmail.Size = new System.Drawing.Size(35, 13);
            this.lblEmail.TabIndex = 13;
            this.lblEmail.Text = "Email";

            // txtEmail
            this.txtEmail.Location = new System.Drawing.Point(160, 322);
            this.txtEmail.Name = "txtEmail";
            this.txtEmail.Size = new System.Drawing.Size(260, 22);
            this.txtEmail.TabIndex = 14;

            // lblAbout
            this.lblAbout.AutoSize = true;
            this.lblAbout.Location = new System.Drawing.Point(160, 360);
            this.lblAbout.Name = "lblAbout";
            this.lblAbout.Size = new System.Drawing.Size(35, 13);
            this.lblAbout.TabIndex = 15;
            this.lblAbout.Text = "About";

            // txtAbout
            this.txtAbout.Location = new System.Drawing.Point(160, 376);
            this.txtAbout.Name = "txtAbout";
            this.txtAbout.Size = new System.Drawing.Size(260, 22);
            this.txtAbout.TabIndex = 16;

            // lblAddress
            this.lblAddress.AutoSize = true;
            this.lblAddress.Location = new System.Drawing.Point(160, 414);
            this.lblAddress.Name = "lblAddress";
            this.lblAddress.Size = new System.Drawing.Size(48, 13);
            this.lblAddress.TabIndex = 17;
            this.lblAddress.Text = "Address";

            // txtAddress
            this.txtAddress.Location = new System.Drawing.Point(160, 430);
            this.txtAddress.Name = "txtAddress";
            this.txtAddress.Size = new System.Drawing.Size(260, 22);
            this.txtAddress.TabIndex = 18;

            // lblVertical
            this.lblVertical.AutoSize = true;
            this.lblVertical.Location = new System.Drawing.Point(160, 468);
            this.lblVertical.Name = "lblVertical";
            this.lblVertical.Size = new System.Drawing.Size(44, 13);
            this.lblVertical.TabIndex = 19;
            this.lblVertical.Text = "Vertical";

            // cboVertical
            this.cboVertical.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDown;
            this.cboVertical.Location = new System.Drawing.Point(160, 484);
            this.cboVertical.Name = "cboVertical";
            this.cboVertical.Size = new System.Drawing.Size(260, 21);
            this.cboVertical.TabIndex = 20;
            this.cboVertical.Items.AddRange(new object[] {
                "OTHER", "AUTO", "BEAUTY", "APPAREL", "EDU", "ENTERTAIN",
                "EVENT_PLAN", "FINANCE", "GROCERY", "GOVT", "HOTEL", "HEALTH",
                "NONPROFIT", "PROF_SERVICES", "RETAIL", "TRAVEL", "RESTAURANT",
                "ALCOHOL", "ONLINE_GAMBLING", "PHYSICAL_GAMBLING", "OTC_DRUGS"});

            // lblWebsites
            this.lblWebsites.AutoSize = true;
            this.lblWebsites.Location = new System.Drawing.Point(160, 522);
            this.lblWebsites.Name = "lblWebsites";
            this.lblWebsites.Size = new System.Drawing.Size(50, 13);
            this.lblWebsites.TabIndex = 21;
            this.lblWebsites.Text = "Websites";

            // txtWebsites
            this.txtWebsites.Location = new System.Drawing.Point(160, 538);
            this.txtWebsites.Multiline = true;
            this.txtWebsites.Name = "txtWebsites";
            this.txtWebsites.Size = new System.Drawing.Size(260, 56);
            this.txtWebsites.TabIndex = 22;

            // btnSave
            this.btnSave.BackColor = System.Drawing.Color.FromArgb(7, 94, 84);
            this.btnSave.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnSave.ForeColor = System.Drawing.Color.White;
            this.btnSave.Location = new System.Drawing.Point(160, 610);
            this.btnSave.Name = "btnSave";
            this.btnSave.Size = new System.Drawing.Size(120, 32);
            this.btnSave.TabIndex = 23;
            this.btnSave.Text = "Save Changes";
            this.btnSave.UseVisualStyleBackColor = false;
            this.btnSave.Click += new System.EventHandler(this.BtnSave_Click);

            // PhoneNumberDetailView
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.Color.White;
            this.Controls.Add(this.btnSave);
            this.Controls.Add(this.txtWebsites);
            this.Controls.Add(this.lblWebsites);
            this.Controls.Add(this.cboVertical);
            this.Controls.Add(this.lblVertical);
            this.Controls.Add(this.txtAddress);
            this.Controls.Add(this.lblAddress);
            this.Controls.Add(this.txtAbout);
            this.Controls.Add(this.lblAbout);
            this.Controls.Add(this.txtEmail);
            this.Controls.Add(this.lblEmail);
            this.Controls.Add(this.txtQuality);
            this.Controls.Add(this.label5);
            this.Controls.Add(this.cboCompany);
            this.Controls.Add(this.label4);
            this.Controls.Add(this.txtDescription);
            this.Controls.Add(this.label3);
            this.Controls.Add(this.txtDisplayName);
            this.Controls.Add(this.label2);
            this.Controls.Add(this.txtPhoneId);
            this.Controls.Add(this.label1);
            this.Controls.Add(this.btnFetchMeta);
            this.Controls.Add(this.btnUploadPhoto);
            this.Controls.Add(this.picProfile);
            this.Name = "PhoneNumberDetailView";
            this.Size = new System.Drawing.Size(460, 660);
            ((System.ComponentModel.ISupportInitialize)(this.picProfile)).EndInit();
            this.ResumeLayout(false);
            this.PerformLayout();
        }
    }
}
